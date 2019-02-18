package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"strconv"

	t "./types"
	yaml "gopkg.in/yaml.v2"

	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

const APIPath = "https://s2.coinmarketcap.com/generated/"
const globalStatsPath = APIPath + "stats/global.json"
const currenciesListPath = APIPath + "search/quick_search.json"
const cryptoCurrencyPath = "https://graphs2.coinmarketcap.com/currencies/"

/*type GlobalSettings struct {
	Active_cryptocurrencies                  int
	Active_markets                           int
	Bitcoin_percentage_of_market_cap         float64
	Total_market_cap_by_available_supply_usd float64
	Total_volume_usd                         float64
}

type CryptoCurrencyStats struct {
	Market_cap_by_available_supply [][]float64
	Price_btc                      [][]float64
	Price_usd                      [][]float64
	Volume_usd                     [][]float64
}*/

/*type CryptoCurrencyInfo struct {
	Id     int    `json:"id"`
	Name   string `json:"name"`
	Rank   int    `json:"rank"`
	Slug   string `json:"slug"`
	Symbol string `json:"symbol"`
}

type ResponseObject struct {
	Found   bool                  `json:"found"`
	Message string                `json:"message"`
	Results t.CryptoCurrencyStats `json:"results"`
}

type ResponseObjectCurrenciesList struct {
	Found   bool                   `json:"found"`
	Message string                 `json:"message"`
	Results []t.CryptoCurrencyInfo `json:"results"`
}

type ResponseObjectGlobalStats struct {
	Found   bool             `json:"found"`
	Message string           `json:"message"`
	Results t.GlobalSettings `json:"results"`
}

type NewPoint struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type Message struct {
	Info    string   `json:"info"`
	Message NewPoint `json:"message"`
}
type Client struct {
	Connected   bool
	LastRequest string
}*/

type Conf struct {
	Currency string `json:"currency"`
	Time     int64  `json:"time"`
}

var upgrader = websocket.Upgrader{}
var wsupgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}
var clients = make(map[*websocket.Conn]t.Client) // connected clients
var router *gin.Engine

func main() {
	// Set the router as the default one shipped with Gin
	router = gin.Default()
	router.Use(middleware)

	// Serve frontend static files
	router.Use(static.Serve("/", static.LocalFile("./views/public", true)))
	initializeRoutes()

	/*
			if req.Header.Get("Origin") != "http://"+req.Host {
			http.Error(w, "Origin not allowed", http.StatusForbidden)
			return
		}
	*/
	wsupgrader.CheckOrigin = func(r *http.Request) bool {
		if r.Header.Get("Origin") != "http://"+r.Host {
			//http.Error(w, "Origin not allowed", http.StatusForbidden)
			return true
		}
		return true
	}
	// Configure websocket route
	router.GET("/ws", func(c *gin.Context) {
		wshandler(c.Writer, c.Request)
	})

	var c Conf
	c.getConf()

	fmt.Println(c)

	// Start and run the server
	router.Run(":8082")

	//Get Global Stats
	//u := getGlobalStats(globalStats)
	//fmt.Print(u)

	//Get Currencies List
	//v := getCurrenciesList(currenciesListPath)
	//fmt.Print(v)
}

func (c *Conf) getConf() *Conf {

	absPath, _ := filepath.Abs("conf.yaml")
	yamlFile, err := ioutil.ReadFile(absPath)
	if err != nil {
		log.Printf("yamlFile.Get err   #%v ", err)
	}
	err = yaml.Unmarshal(yamlFile, c)
	if err != nil {
		log.Fatalf("Unmarshal: %v", err)
	}

	return c
}

func wshandler(w http.ResponseWriter, r *http.Request) {
	conn, err := wsupgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Failed to set websocket upgrade: %+v", err)
		return
	}

	//fmt.Print("Client", len(clients), "\n")
	clients[conn] = t.Client{true, strconv.Itoa(len(clients))}

	for {
		_, msg, err := conn.ReadMessage()
		fmt.Print("Socket msg: ", clients[conn], msg, "\n")
		if err != nil {
			fmt.Printf("error: %v", err)
			//clients[conn] = Client{false, clients[conn].LastRequest}
			delete(clients, conn)
			break
		}

		var newMessage = new(t.Message)
		newMessage.Info = "ok"
		var nPoint = new(t.NewPoint)
		nPoint.X = 1
		nPoint.Y = 15
		newMessage.Message = *nPoint
		conn.WriteJSON(newMessage)

		for client := range clients {
			err := client.WriteJSON("HELLO" + strconv.Itoa(len(clients)))
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

func EchoServer() {
	fmt.Print("ECHO")
}

func initializeRoutes() {
	// Setup route group for the API
	api := router.Group("/api")

	/****  REST API ****/
	//Stats
	api.GET("/stats/global", GetGlobalStatsHandler)
	api.GET("/stats/currencies", GetCurrenciesListHandler)
	//Currencies
	api.GET("/currencies/:currency", GetCurrencyHandler)

	router.NoRoute(NoRouteHandler)
}

func GetGlobalStatsHandler(c *gin.Context) {
	var response t.ResponseObjectGlobalStats
	//Get Currency Stats
	globalStats := getGlobalStats(globalStatsPath)

	if globalStats.Active_cryptocurrencies != 0 {
		response.Found = true
		response.Results = globalStats
	} else {
		response.Found = false
		response.Message = "No currency found"
	}

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, response)
}

func GetCurrenciesListHandler(c *gin.Context) {
	var response t.ResponseObjectCurrenciesList
	//Get Currency Stats
	currencyList := getCurrenciesList(currenciesListPath)

	if len(currencyList) > 0 {
		response.Found = true
		response.Results = currencyList
	} else {
		response.Found = false
		response.Message = "No currency found"
	}

	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, response)
}

func GetCurrencyHandler(c *gin.Context) {
	var currency = c.Param("currency")
	startTime := c.Query("startTime")
	endTime := c.Query("endTime")

	var url string = cryptoCurrencyPath + currency
	if startTime != "" && endTime != "" {
		url = url + "/" + startTime + "/" + endTime
	}
	fmt.Print("Start: ", url)
	var response t.ResponseObject
	//Get Currency Stats
	currencyStats := getCurrencyStats(url)

	if len(currencyStats.Market_cap_by_available_supply) > 0 {
		response.Found = true
		response.Results = currencyStats
	} else {
		response.Found = false
		response.Message = "No currency found"
	}
	fmt.Print("Length: ", len(currencyStats.Price_usd))
	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusOK, response)
}

func NoRouteHandler(c *gin.Context) {
	c.Header("Content-Type", "application/json")
	c.JSON(http.StatusNotFound, gin.H{"message": "Not found"})
}

func middleware(c *gin.Context) {
	if c.Request.Method == "OPTIONS" || c.Request.Method == "GET" || c.Request.Method == "POST" {
		c.Header("Allow", "POST, GET, OPTIONS")
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Headers", "origin, content-type, accept")
		c.Header("Content-Type", "application/json")
		c.Status(http.StatusOK)
	}

	c.Next()
}

func getCurrencyStats(url string) t.CryptoCurrencyStats {
	fmt.Println("Send Request")
	target := new(t.CryptoCurrencyStats)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(target)
	fmt.Print(resp.Body)
	return *target
}

func getCurrenciesList(url string) []t.CryptoCurrencyInfo {
	fmt.Println("Send Request", url)
	target := new([]t.CryptoCurrencyInfo)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(target)
	return *target
}

func getGlobalStats(url string) t.GlobalSettings {
	fmt.Println("Send Request")
	target := new(t.GlobalSettings)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(target)
	return *target
}
