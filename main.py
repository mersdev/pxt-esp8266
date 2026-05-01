"""
*****************************************************************************
MakeCode extension for ESP8266 Wifi module.

Company: Cytron Technologies Sdn Bhd
Website: http://www.cytron.io
Email:   support@cytron.io
****************************************************************************
"""
"""

Blocks for ESP8266 WiFi module.

"""
# % weight=10 color=#ff8000 icon="\uf1eb" block="ESP8266 WiFi"
@namespace
class esp8266:
    # Flag to indicate whether the ESP8266 was initialized successfully.
    esp8266Initialized = False
    # Buffer for data received from UART.
    rxData = ""
    """
    
    Send AT command and wait for response.
    Return true if expected response is received.
    @param command The AT command without the CRLF.
    @param expected_response Wait for this response.
    @param timeout Timeout in milliseconds.
    
    """
    # % blockHidden=true
    # % blockId=esp8266_send_command
    def sendCommand(command: str, expected_response: str = None, timeout: number = 100):
        global rxData
        # Wait a while from previous command.
        basic.pause(10)
        # Flush the Rx buffer.
        serial.read_string()
        rxData = ""
        # Send the command and end with "\r\n".
        serial.write_string(command + "\r\n")
        # Don't check if expected response is not specified.
        if expected_response == None:
            return True
        # Wait and verify the response.
        result = False
        timestamp = input.running_time()
        while True:
            # Timeout.
            if input.running_time() - timestamp > timeout:
                result = False
                break
            # Read until the end of the line.
            rxData += serial.read_string()
            if rxData.includes("\r\n"):
                # Check if expected response received.
                if rxData.slice(0, rxData.index_of("\r\n")).includes(expected_response):
                    result = True
                    break
                # If we expected "OK" but "ERROR" is received, do not wait for timeout.
                if expected_response == "OK":
                    if rxData.slice(0, rxData.index_of("\r\n")).includes("ERROR"):
                        result = False
                        break
                # Trim the Rx data before loop again.
                rxData = rxData.slice(rxData.index_of("\r\n") + 2)
        return result
    """
    
    Get the specific response from ESP8266.
    Return the line start with the specific response.
    @param command The specific response we want to get.
    @param timeout Timeout in milliseconds.
    
    """
    # % blockHidden=true
    # % blockId=esp8266_get_response
    def getResponse(response: str, timeout2: number = 100):
        global rxData
        responseLine = ""
        timestamp2 = input.running_time()
        while True:
            # Timeout.
            if input.running_time() - timestamp2 > timeout2:
                # Check if expected response received in case no CRLF received.
                if rxData.includes(response):
                    responseLine = rxData
                break
            # Read until the end of the line.
            rxData += serial.read_string()
            if rxData.includes("\r\n"):
                # Check if expected response received.
                if rxData.slice(0, rxData.index_of("\r\n")).includes(response):
                    responseLine = rxData.slice(0, rxData.index_of("\r\n"))
                    # Trim the Rx data for next call.
                    rxData = rxData.slice(rxData.index_of("\r\n") + 2)
                    break
                # Trim the Rx data before loop again.
                rxData = rxData.slice(rxData.index_of("\r\n") + 2)
        return responseLine
    """
    
    Format the encoding of special characters in the url.
    @param url The url that we want to format.
    
    """
    # % blockHidden=true
    # % blockId=esp8266_format_url
    def formatUrl(url: str):
        url = url.replace_all("%", "%25")
        url = url.replace_all(" ", "%20")
        url = url.replace_all("!", "%21")
        url = url.replace_all("\"", "%22")
        url = url.replace_all("#", "%23")
        url = url.replace_all("$", "%24")
        url = url.replace_all("&", "%26")
        url = url.replace_all("'", "%27")
        url = url.replace_all("(", "%28")
        url = url.replace_all(")", "%29")
        url = url.replace_all("*", "%2A")
        url = url.replace_all("+", "%2B")
        url = url.replace_all(",", "%2C")
        url = url.replace_all("-", "%2D")
        url = url.replace_all(".", "%2E")
        url = url.replace_all("/", "%2F")
        url = url.replace_all(":", "%3A")
        url = url.replace_all(";", "%3B")
        url = url.replace_all("<", "%3C")
        url = url.replace_all("=", "%3D")
        url = url.replace_all(">", "%3E")
        url = url.replace_all("?", "%3F")
        url = url.replace_all("@", "%40")
        url = url.replace_all("[", "%5B")
        url = url.replace_all("\\", "%5C")
        url = url.replace_all("]", "%5D")
        url = url.replace_all("^", "%5E")
        url = url.replace_all("_", "%5F")
        url = url.replace_all("`", "%60")
        url = url.replace_all("{", "%7B")
        url = url.replace_all("|", "%7C")
        url = url.replace_all("}", "%7D")
        url = url.replace_all("~", "%7E")
        return url
    """
    
    Return true if the ESP8266 is already initialized.
    
    """
    # % weight=30
    # % blockGap=8
    # % blockId=esp8266_is_esp8266_initialized
    # % block="ESP8266 initialized"
    def isESP8266Initialized():
        return esp8266Initialized
    """
    
    Initialize the ESP8266.
    @param tx Tx pin of micro:bit. eg: SerialPin.P16
    @param rx Rx pin of micro:bit. eg: SerialPin.P15
    @param baudrate UART baudrate. eg: BaudRate.BaudRate115200
    
    """
    # % weight=29
    # % blockGap=40
    # % blockId=esp8266_init
    # % block="initialize ESP8266: Tx %tx Rx %rx Baudrate %baudrate"
    def init(tx: SerialPin, rx: SerialPin, baudrate: BaudRate):
        global esp8266Initialized
        # Redirect the serial port.
        serial.redirect(tx, rx, baudrate)
        serial.set_tx_buffer_size(128)
        serial.set_rx_buffer_size(128)
        # Reset the flag.
        esp8266Initialized = False
        # Restore the ESP8266 factory settings.
        if sendCommand("AT+RESTORE", "ready", 5000) == False:
            return
        # Turn off echo.
        if sendCommand("ATE0", "OK") == False:
            return
        # Initialized successfully.
        # Set the flag.
        esp8266Initialized = True
    """
    
    Return true if the ESP8266 is connected to WiFi router.
    
    """
    # % weight=28
    # % blockGap=8
    # % blockId=esp8266_is_wifi_connected
    # % block="WiFi connected"
    def isWifiConnected():
        # Get the connection status.
        sendCommand("AT+CIPSTATUS")
        status = getResponse("STATUS:", 1000)
        # Wait until OK is received.
        getResponse("OK")
        # Return the WiFi status.
        if (status == "") or status.includes("STATUS:5"):
            return False
        else:
            return True
    """
    
    Connect to WiFi router.
    @param ssid Your WiFi SSID.
    @param password Your WiFi password.
    
    """
    # % weight=27
    # % blockGap=8
    # % blockId=esp8266_connect_wifi
    # % block="connect to WiFi: SSID %ssid Password %password"
    def connectWiFi(ssid: str, password: str):
        # Set to station mode.
        sendCommand("AT+CWMODE=1", "OK")
        # Connect to WiFi router.
        sendCommand("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"",
            "OK",
            20000)