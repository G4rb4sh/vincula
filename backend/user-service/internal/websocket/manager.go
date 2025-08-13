package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type WebSocketManager struct {
	clients     map[*Client]bool
	clientsByID map[string]*Client
	register    chan *Client
	unregister  chan *Client
	broadcast   chan []byte
	mutex       sync.RWMutex
}

type Client struct {
	ID   string
	Role string
	Conn *websocket.Conn
	Send chan []byte
	hub  *WebSocketManager
}

type Message struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	Recipient string      `json:"recipient,omitempty"`
	Role      string      `json:"role,omitempty"`
	UserID    string      `json:"user_id,omitempty"`
	Timestamp string      `json:"timestamp,omitempty"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // En producción, validar origen
	},
}

func NewWebSocketManager() *WebSocketManager {
	return &WebSocketManager{
		clients:     make(map[*Client]bool),
		clientsByID: make(map[string]*Client),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		broadcast:   make(chan []byte),
	}
}

func (ws *WebSocketManager) Run() {
	for {
		select {
		case client := <-ws.register:
			ws.mutex.Lock()
			ws.clients[client] = true
			ws.clientsByID[client.ID] = client
			ws.mutex.Unlock()

			log.Printf("Cliente WebSocket conectado: %s (%s)", client.ID, client.Role)

		case client := <-ws.unregister:
			ws.mutex.Lock()
			if _, ok := ws.clients[client]; ok {
				delete(ws.clients, client)
				delete(ws.clientsByID, client.ID)
				close(client.Send)
			}
			ws.mutex.Unlock()

			log.Printf("Cliente WebSocket desconectado: %s", client.ID)

		case message := <-ws.broadcast:
			ws.mutex.RLock()
			for client := range ws.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(ws.clients, client)
					delete(ws.clientsByID, client.ID)
				}
			}
			ws.mutex.RUnlock()
		}
	}
}

func (ws *WebSocketManager) HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Error upgrading to websocket: %v", err)
		return
	}

	userID := c.GetString("user_id")
	userRole := c.GetString("user_role")

	client := &Client{
		ID:   userID,
		Role: userRole,
		Conn: conn,
		Send: make(chan []byte, 256),
		hub:  ws,
	}

	client.hub.register <- client

	go client.writePump()
	go client.readPump()
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Error parsing WebSocket message: %v", err)
			continue
		}

		// Procesar mensaje recibido
		c.handleMessage(&msg)
	}
}

func (c *Client) writePump() {
	defer c.Conn.Close()

	for {
		select {
		case message, ok := <-c.Send:
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			c.Conn.WriteMessage(websocket.TextMessage, message)
		}
	}
}

func (c *Client) handleMessage(msg *Message) {
	log.Printf("WebSocket message received from %s: %s", c.ID, msg.Type)

	switch msg.Type {
	case "auth":
		// Mensaje de autenticación recibido
		response := Message{
			Type: "auth_response",
			Data: map[string]interface{}{
				"status":  "authenticated",
				"user_id": c.ID,
				"role":    c.Role,
			},
		}
		c.sendMessage(response)

	case "ping":
		// Responder a ping con pong
		response := Message{
			Type: "pong",
			Data: map[string]interface{}{
				"timestamp": msg.Data,
			},
		}
		c.sendMessage(response)

	default:
		log.Printf("Unknown message type: %s", msg.Type)
	}
}

func (c *Client) sendMessage(msg Message) {
	jsonData, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling WebSocket message: %v", err)
		return
	}

	select {
	case c.Send <- jsonData:
	default:
		close(c.Send)
		c.hub.mutex.Lock()
		delete(c.hub.clients, c)
		delete(c.hub.clientsByID, c.ID)
		c.hub.mutex.Unlock()
	}
}

func (ws *WebSocketManager) BroadcastToRole(role string, data interface{}) {
	message := Message{
		Type: "broadcast",
		Data: data,
		Role: role,
	}

	jsonData, _ := json.Marshal(message)

	ws.mutex.RLock()
	defer ws.mutex.RUnlock()

	for client := range ws.clients {
		if client.Role == role {
			select {
			case client.Send <- jsonData:
			default:
				close(client.Send)
				delete(ws.clients, client)
				delete(ws.clientsByID, client.ID)
			}
		}
	}
}

func (ws *WebSocketManager) SendToUser(userID string, data interface{}) {
	ws.mutex.RLock()
	client, exists := ws.clientsByID[userID]
	ws.mutex.RUnlock()

	if !exists {
		log.Printf("WebSocket client not found for user %s", userID)
		return
	}

	var jsonData []byte
	var err error

	// Si data ya es []byte (JSON), úsalo directamente
	if bytes, ok := data.([]byte); ok {
		jsonData = bytes
	} else {
		// Si no, crear un mensaje wrapper
		message := Message{
			Type: "direct",
			Data: data,
		}
		jsonData, err = json.Marshal(message)
		if err != nil {
			log.Printf("Error marshaling message for user %s: %v", userID, err)
			return
		}
	}

	select {
	case client.Send <- jsonData:
		log.Printf("Sent WebSocket message to user %s", userID)
	default:
		close(client.Send)
		ws.mutex.Lock()
		delete(ws.clients, client)
		delete(ws.clientsByID, client.ID)
		ws.mutex.Unlock()
		log.Printf("Failed to send message to user %s, client disconnected", userID)
	}
}
