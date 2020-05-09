package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

	t "./types"
	yaml "gopkg.in/yaml.v2"

	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Conf struct {
	Currency 	string `json:"currency"`
	Time     	int64  `json:"time"`
	APIPath 	string `json:"apipath"`
	CryptoCurrencyPath string `json:"cryptocurrencypath"`
	GlobalStatsPath string `json:"globalstatspath"`
	CurrenciesListPath string `json:"currencieslistpath"`
}

var upgrader = websocket.Upgrader{}
var wsupgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}
var clients = make(map[*websocket.Conn]t.Client) // connected clients
var router *gin.Engine
var conf Conf

func main() {
	//Set varaibles
	conf.getConf()
	log.Print(conf)
	// Set the router as the default one shipped with Gin
	router = gin.Default()
	router.Use(middleware)
	//router.Use(MustLocal)

	// Serve frontend static files
	router.Use(static.Serve("/", static.LocalFile("./views/public", true)))
	initializeRoutes()

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
	globalStats := getGlobalStats(conf.APIPath + conf.GlobalStatsPath)

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
	currencyList := getCurrenciesList(conf.APIPath + conf.CurrenciesListPath)

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

func SetCurrencyParameters(start string, end string, currency string) string{
	var param  string = ""
	if start != "" && end != "" {
		param = "&time_start=" + start
		param = param + "&time_end=" + end
	}

	if currency != "" {
		param = param + "&convert=USD," + currency
	}

	return param
}

func GetCurrencyHandler(c *gin.Context) {
	var currency = c.Param("currency")
	startTime := c.Query("startTime")
	endTime := c.Query("endTime")

	var url string = conf.CryptoCurrencyPath
	var param string = SetCurrencyParameters(startTime, endTime, currency)
	url = url + param

	fmt.Print("Start: ", url)
	var response t.ResponseObject

	//Get Currency Stats
	currencyStats := getCurrencyStats(url)
	if currencyStats.Status.Error_code == 0 {
		response.Found = true
		response.Results = currencyStats.Data
	} else {
		response.Found = false
		response.Message = "No currency found"
	}

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
		//c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Headers", "origin, content-type, accept")
		c.Header("Content-Type", "application/json")
		c.Status(http.StatusOK)
	}

	if strings.HasPrefix(c.Request.RemoteAddr, "127.0.0.1") || strings.HasPrefix(c.Request.RemoteAddr, "[::1]") || strings.HasPrefix(c.Request.RemoteAddr, "10.5.95.50") {
		c.Header("Access-Control-Allow-Origin", "*")
	}

	c.Next()
}

// MustLocal enforces that a request must come only from the localhost.
func MustLocal(c *gin.Context) {

	if strings.HasPrefix(c.Request.RemoteAddr, "127.0.0.1") ||
		strings.HasPrefix(c.Request.RemoteAddr, "[::1]") {
		return
	}
	c.Error(fmt.Errorf("request to expvars from remote host: %s", c.Request.RemoteAddr)).
		SetType(gin.ErrorTypePrivate)
	c.AbortWithError(http.StatusForbidden, errors.New("expvar access is forbidden"))

}

func getCurrencyStats(url string) t.CryptoCurrencyStats {
	fmt.Println("Send Request", url)
	target := new(t.CryptoCurrencyStats)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(target)
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
	fmt.Println("Send Request", url)
	target := new(t.GlobalSettings)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(target)
	return *target
}
