package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/contrib/static"
	"github.com/gin-gonic/gin"
)

const APIPath = "https://s2.coinmarketcap.com/generated/"
const globalStatsPath = APIPath + "stats/global.json"
const currenciesListPath = APIPath + "search/quick_search.json"
const cryptoCurrencyPath = "https://graphs2.coinmarketcap.com/currencies/ethereum/"

type GlobalSettings struct {
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
}

type CryptoCurrencyInfo struct {
	id     int
	Name   string
	Rank   int
	Slug   string
	Symbol string
}

type ResponseObject struct {
	Found   bool                `json:"found"`
	Message string              `json:"message"`
	Results CryptoCurrencyStats `json:"results"`
}

type ResponseObjectCurrenciesList struct {
	Found   bool                 `json:"found"`
	Message string               `json:"message"`
	Results []CryptoCurrencyInfo `json:"results"`
}

type ResponseObjectGlobalStats struct {
	Found   bool           `json:"found"`
	Message string         `json:"message"`
	Results GlobalSettings `json:"results"`
}

var router *gin.Engine

func main() {
	// Set the router as the default one shipped with Gin
	router = gin.Default()
	router.Use(middleware)

	// Serve frontend static files
	router.Use(static.Serve("/", static.LocalFile("./views/public", true)))
	initializeRoutes()

	// Start and run the server
	router.Run(":8082")

	//Get Global Stats
	//u := getGlobalStats(globalStats)
	//fmt.Print(u)

	//Get Currencies List
	//v := getCurrenciesList(currenciesListPath)
	//fmt.Print(v)
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
	var response ResponseObjectGlobalStats
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
	var response ResponseObjectCurrenciesList
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
	var response ResponseObject
	//Get Currency Stats
	currencyStats := getCurrencyStats(cryptoCurrencyPath)

	if len(currencyStats.Market_cap_by_available_supply) > 0 {
		response.Found = true
		response.Results = currencyStats
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
		c.Header("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Header("Access-Control-Allow-Headers", "origin, content-type, accept")
		c.Header("Content-Type", "application/json")
		c.Status(http.StatusOK)
	}

	c.Next()
}

func getCurrencyStats(url string) CryptoCurrencyStats {
	fmt.Println("Send Request")
	target := new(CryptoCurrencyStats)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(target)
	fmt.Print(resp.Body)
	return *target
}

func getCurrenciesList(url string) []CryptoCurrencyInfo {
	fmt.Println("Send Request", url)
	target := new([]CryptoCurrencyInfo)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(target)
	return *target
}

func getGlobalStats(url string) GlobalSettings {
	fmt.Println("Send Request")
	target := new(GlobalSettings)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println(err)
	}
	defer resp.Body.Close()

	json.NewDecoder(resp.Body).Decode(target)
	return *target
}
