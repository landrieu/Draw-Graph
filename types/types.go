package types

type GlobalSettings struct {
	Active_cryptocurrencies                  int
	Active_markets                           int
	Bitcoin_percentage_of_market_cap         float64
	Total_market_cap_by_available_supply_usd float64
	Total_volume_usd                         float64
}

type CryptoCurrencyStats struct {
	/*Market_cap_by_available_supply [][]float64
	Price_btc                      [][]float64
	Price_usd                      [][]float64
	Volume_usd                     [][]float64*/
	Status	CryptoCurrencyStatus `json:"status"`
	Data	interface{} `json:"data"`
}

type jsoninput []struct {
    Data string `json:"data"`
}

type CryptoCurrencyData struct {
	CryptoCurrencyDataDetails
}

type CryptoCurrencyDataDetails struct {
	BTC []float64 `json:"BTC"`
	USD []float64 `json:"USD"`
}

type CryptoCurrencyStatus struct {
	//"timestamp": "2020-04-07T12:54:21.950Z",
	//"elapsed": 62,
	//"credit_count": 3,
    //"notice": null
	Error_code int `json:"error_code"`
	Error_message string `json:"error_message"`
}
        
type CryptoCurrencyInfo struct {
	Id     int    `json:"id"`
	Name   string `json:"name"`
	Rank   int    `json:"rank"`
	Slug   string `json:"slug"`
	Symbol string `json:"symbol"`
}

type ResponseObject struct {
	Found   bool                `json:"found"`
	Message string              `json:"message"`
	Results interface{} `json:"results"`
	//CryptoCurrencyStats `json:"results"`
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
}

type Conf struct {
	Currency string `json:"currency"`
	Time     int64  `json:"time"`
}
