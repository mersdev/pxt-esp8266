/*******************************************************************************
 * Minimal HTTP GET web server endpoints.
 *
 * Company: Cytron Technologies Sdn Bhd
 * Website: http://www.cytron.io
 * Email:   support@cytron.io
 *******************************************************************************/

namespace esp8266 {
    let webServerRunning = false
    let webServerIP = ""
    const WEB_SERVER_PORT = 80
    const WEB_SERVER_STATIC_IP = "192.168.1.88"
    const WEB_SERVER_GATEWAY = "192.168.1.1"
    const WEB_SERVER_NETMASK = "255.255.255.0"

    // Endpoint paths.
    let receivedFromWebAppPath = "/receivedFromWebApp"

    // Parsed query values.
    let lastSensor = ""
    let lastOutput = ""
    let lastAction = ""

    // Internal parser state.
    let webLinkId = -1
    let webRxData = ""
    let pendingRoute = ""

    //% subcategory="Web Server"
    //% blockId=esp8266_start_web_server
    //% block="Start Web Server"
    export function startWebServer() {
        webServerRunning = false
        if (!isWifiConnected()) return

        sendCommand("AT+CIPSTA=\"" + WEB_SERVER_STATIC_IP + "\",\"" + WEB_SERVER_GATEWAY + "\",\"" + WEB_SERVER_NETMASK + "\"", "OK", 2000)
        sendCommand("AT+CIPSERVER=0", "OK", 1000)
        if (!sendCommand("AT+CIPMUX=1", "OK", 1000)) return
        if (!sendCommand("AT+CIPSERVER=1," + WEB_SERVER_PORT, "OK", 2000)) return

        // Show the real IP from ESP8266 immediately after server start.
        showRealIPAddress()
        updateWebServerIP()
        serial.writeLine("IP Address: " + webServerIP)
        webServerRunning = true
    }

    //% subcategory="Web Server"
    //% blockId=esp8266_stop_web_server
    //% block="Stop Web Server"
    export function stopWebServer() {
        if (!sendCommand("AT+CIPSERVER=0", "OK", 2000)) {
            webServerRunning = false
            return
        }

        sendCommand("AT+CIPMUX=0", "OK", 1000)
        webServerRunning = false
    }

    //% subcategory="Web Server"
    //% blockId=esp8266_get_ip_address
    //% block="Get IP Address"
    export function getIPAddress(): string {
        refreshWebServerIP()
        serial.writeLine("IP Address: " + webServerIP)
        return webServerIP
    }

    //% subcategory="Web Server"
    //% blockId=esp8266_show_real_ip
    //% block="Show Real IP Address"
    export function showRealIPAddress() {
        sendCommand("AT+CIFSR")
        let line = getResponse("+CIFSR:STAIP", 2000)
        sendCommand("IP Address: " + line, "", 500)
        getResponse("OK", 500)
    }

    //% subcategory="Web Server"
    //% blockId=esp8266_web_server_started
    //% block="Web Server Started"
    export function webServerStarted(): boolean {
        return webServerRunning
    }

    //% subcategory="Web Server"
    //% blockId=esp8266_web_server_online
    //% block="Web Server Online"
    export function webServerOnline(): boolean {
        return webServerRunning
    }

    //% blockHidden=true
    export function refreshWebServerIP() {
        updateWebServerIP()
    }

    //% subcategory="Web Server"
    //% blockId=esp8266_received_from_web_app
    //% block="Received /receivedFromWebApp Endpoint"
    export function receivedReceivedFromWebAppEndpoint(): boolean {
        if (!readOneRequest()) return false
        if (pendingRoute != "receivedFromWebApp") return false

        sendHttpResponse(webLinkId, 200, "OK", "RECEIVED")
        return true
    }

    //% subcategory="Web Server"
    //% blockId=esp8266_sensor
    //% block="sensor"
    export function sensor(): string {
        return lastSensor
    }

    //% subcategory="Web Server"
    //% blockId=esp8266_output
    //% block="output"
    export function output(): string {
        return lastOutput
    }

    //% subcategory="Web Server"
    //% blockId=esp8266_action
    //% block="action"
    export function action(): string {
        return lastAction
    }

    function updateWebServerIP() {
        webServerIP = ""
        if (!isWifiConnected()) return

        sendCommand("AT+CIFSR")
        let line = getResponse("+CIFSR:STAIP", 2000)
        if (line == "") return

        let q1 = line.indexOf("\"")
        let q2 = line.indexOf("\"", q1 + 1)
        if ((q1 >= 0) && (q2 > q1)) {
            webServerIP = line.substr(q1 + 1, q2 - q1 - 1)
        }

        getResponse("OK", 500)
    }

    function readOneRequest(): boolean {
        clearPending()
        if (!webServerRunning) return false

        let started = input.runningTime()
        while (input.runningTime() - started <= 120) {
            webRxData += serial.readString()

            let request = extractHttpRequestFromBuffer()
            if (request == "") {
                basic.pause(5)
                continue
            }

            parseHttpRequest(request)
            if (pendingRoute == "invalid") {
                return false
            }

            if (pendingRoute == "receivedFromWebApp") {
                lastSensor = getQueryValue(requestPathQuery, "sensor")
                lastOutput = getQueryValue(requestPathQuery, "output")
                lastAction = getQueryValue(requestPathQuery, "action")
                return true
            }

            sendHttpResponse(webLinkId, 404, "Not Found", "NOT FOUND")
            return false
        }

        return false
    }

    let requestPath = ""
    let requestPathQuery = ""

    function clearPending() {
        pendingRoute = ""
        requestPath = ""
        requestPathQuery = ""
    }

    function extractHttpRequestFromBuffer(): string {
        let start = webRxData.indexOf("+IPD,")
        if (start < 0) {
            if (webRxData.length > 256) webRxData = webRxData.substr(webRxData.length - 128)
            return ""
        }

        let colon = webRxData.indexOf(":", start)
        if (colon < 0) return ""

        let header = webRxData.substr(start + 5, colon - (start + 5))
        let parts = header.split(",")
        if (parts.length < 2) {
            webRxData = webRxData.substr(colon + 1)
            return ""
        }

        webLinkId = parseInt(parts[0])
        let payloadLen = parseInt(parts[1])
        if ((webLinkId < 0) || (payloadLen <= 0)) {
            webRxData = webRxData.substr(colon + 1)
            return ""
        }

        let payloadStart = colon + 1
        if ((webRxData.length - payloadStart) < payloadLen) return ""

        let payload = webRxData.substr(payloadStart, payloadLen)
        webRxData = webRxData.substr(payloadStart + payloadLen)
        return payload
    }

    function parseHttpRequest(request: string) {
        let lineEnd = request.indexOf("\r\n")
        if (lineEnd < 0) lineEnd = request.indexOf("\n")

        let requestLine = request
        if (lineEnd >= 0) requestLine = request.substr(0, lineEnd)

        let parts = requestLine.split(" ")
        if (parts.length < 2) {
            pendingRoute = "invalid"
            sendHttpResponse(webLinkId, 400, "Bad Request", "BAD REQUEST")
            return
        }

        if (parts[0] != "GET") {
            pendingRoute = "invalid"
            sendHttpResponse(webLinkId, 405, "Method Not Allowed", "GET ONLY")
            return
        }

        let pathWithQuery = parts[1]
        let qPos = pathWithQuery.indexOf("?")
        if (qPos >= 0) {
            requestPath = pathWithQuery.substr(0, qPos)
            requestPathQuery = pathWithQuery.substr(qPos + 1)
        } else {
            requestPath = pathWithQuery
            requestPathQuery = ""
        }

        if (requestPath == receivedFromWebAppPath) pendingRoute = "receivedFromWebApp"
        else pendingRoute = "unknown"
    }

    function getQueryValue(query: string, key: string): string {
        if ((query == "") || (key == "")) return ""

        let params = query.split("&")
        for (let i = 0; i < params.length; i++) {
            let pair = params[i].split("=")
            if ((pair.length >= 2) && (pair[0] == key)) return pair[1]
        }

        return ""
    }

    function sendHttpResponse(linkId: number, statusCode: number, statusText: string, body: string) {
        if (linkId < 0) return

        let response = "HTTP/1.1 " + statusCode + " " + statusText + "\r\n"
        response += "Content-Type: text/plain\r\n"
        response += "Connection: close\r\n"
        response += "Content-Length: " + body.length + "\r\n\r\n"
        response += body

        if (!sendCommand("AT+CIPSEND=" + linkId + "," + response.length, "OK", 1000)) {
            sendCommand("AT+CIPCLOSE=" + linkId, "OK", 1000)
            return
        }

        sendCommand(response)
        getResponse("SEND OK", 1000)
        sendCommand("AT+CIPCLOSE=" + linkId, "OK", 1000)
    }
}
