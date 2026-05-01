/*******************************************************************************
 * Functions for HTTP web server.
 *
 * Company: Cytron Technologies Sdn Bhd
 * Website: http://www.cytron.io
 * Email:   support@cytron.io
 *******************************************************************************/

namespace esp8266 {
    // Flags.
    let webServerRunning = false
    let webRequestReceived = false

    // Last request details.
    let lastRequestMethod = ""
    let lastRequestPath = ""
    let lastRequestBody = ""

    // Response settings.
    let webResponseMessage = "OK"
    let webResponseStatusCode = 200

    // Internal link id from +IPD.
    let webLinkId = -1

    // Buffer for incoming server data.
    let webRxData = ""

    /**
     * Return true if web server is running.
     */
    //% subcategory="Web Server"
    //% weight=30
    //% blockGap=8
    //% blockId=esp8266_is_web_server_running
    //% block="web server running"
    export function isWebServerRunning(): boolean {
        return webServerRunning
    }

    /**
     * Return true if latest web request is received and handled.
     */
    //% subcategory="Web Server"
    //% weight=29
    //% blockGap=8
    //% blockId=esp8266_is_web_request_received
    //% block="web request received"
    export function isWebRequestReceived(): boolean {
        return webRequestReceived
    }

    /**
     * Start web server and listen at selected port.
     * @param port HTTP port. eg: 80
     */
    //% subcategory="Web Server"
    //% weight=28
    //% blockGap=8
    //% blockId=esp8266_start_web_server
    //% block="start web server at port %port"
    //% port.min=1 port.max=65535
    export function startWebServer(port: number = 80) {
        webServerRunning = false

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) return

        // Stop previous server first (ignore result).
        sendCommand("AT+CIPSERVER=0", "OK", 1000)

        // Enable multiple connection mode and start TCP server.
        if (sendCommand("AT+CIPMUX=1", "OK", 1000) == false) return
        if (sendCommand("AT+CIPSERVER=1," + port, "OK", 2000) == false) return

        webServerRunning = true
    }

    /**
     * Stop web server.
     */
    //% subcategory="Web Server"
    //% weight=27
    //% blockGap=8
    //% blockId=esp8266_stop_web_server
    //% block="stop web server"
    export function stopWebServer() {
        if (sendCommand("AT+CIPSERVER=0", "OK", 2000) == false) {
            webServerRunning = false
            return
        }

        // Restore single connection mode for existing client APIs.
        sendCommand("AT+CIPMUX=0", "OK", 1000)
        webServerRunning = false
    }

    /**
     * Set custom response returned by the web server.
     * @param message HTTP response body text.
     * @param statusCode HTTP status code. eg: 200
     */
    //% subcategory="Web Server"
    //% weight=26
    //% blockGap=8
    //% blockId=esp8266_set_web_response
    //% block="set web response message %message status code %statusCode"
    //% statusCode.min=100 statusCode.max=599
    export function setWebResponse(message: string, statusCode: number = 200) {
        webResponseMessage = message
        webResponseStatusCode = statusCode
    }

    /**
     * Check and handle one incoming web request.
     * @param timeout Timeout in milliseconds. eg: 100
     */
    //% subcategory="Web Server"
    //% weight=25
    //% blockGap=8
    //% blockId=esp8266_handle_web_request
    //% block="handle incoming web request with timeout(ms) %timeout"
    export function handleWebRequest(timeout: number = 100): boolean {
        webRequestReceived = false

        if (webServerRunning == false) return false

        let timestamp = input.runningTime()
        while (input.runningTime() - timestamp <= timeout) {
            webRxData += serial.readString()

            let request = extractHttpRequestFromBuffer()
            if (request != "") {
                parseHttpRequest(request)
                sendHttpResponse(webLinkId)
                webRequestReceived = true
                return true
            }

            basic.pause(5)
        }

        return false
    }

    /**
     * Return the HTTP method from last handled request.
     */
    //% subcategory="Web Server"
    //% weight=24
    //% blockGap=8
    //% blockId=esp8266_last_web_request_method
    //% block="last web request method"
    export function lastWebRequestMethod(): string {
        return lastRequestMethod
    }

    /**
     * Return the path from last handled request.
     */
    //% subcategory="Web Server"
    //% weight=23
    //% blockGap=8
    //% blockId=esp8266_last_web_request_path
    //% block="last web request path"
    export function lastWebRequestPath(): string {
        return lastRequestPath
    }

    /**
     * Return request body from last handled request.
     */
    //% subcategory="Web Server"
    //% weight=22
    //% blockGap=40
    //% blockId=esp8266_last_web_request_body
    //% block="last web request body"
    export function lastWebRequestBody(): string {
        return lastRequestBody
    }

    function extractHttpRequestFromBuffer(): string {
        let start = webRxData.indexOf("+IPD,")
        if (start < 0) {
            // Trim stale data.
            if (webRxData.length > 256) {
                webRxData = webRxData.substr(webRxData.length - 128)
            }
            return ""
        }

        let colon = webRxData.indexOf(":", start)
        if (colon < 0) return ""

        // +IPD,<link id>,<length>:<payload>
        let header = webRxData.substr(start + 5, colon - (start + 5))
        let headerParts = header.split(",")
        if (headerParts.length < 2) {
            webRxData = webRxData.substr(colon + 1)
            return ""
        }

        webLinkId = parseInt(headerParts[0])
        let payloadLen = parseInt(headerParts[1])

        if ((webLinkId < 0) || (payloadLen <= 0)) {
            webRxData = webRxData.substr(colon + 1)
            return ""
        }

        let payloadStart = colon + 1
        let availableLen = webRxData.length - payloadStart
        if (availableLen < payloadLen) return ""

        let payload = webRxData.substr(payloadStart, payloadLen)

        // Remove parsed packet and keep remaining data.
        webRxData = webRxData.substr(payloadStart + payloadLen)
        return payload
    }

    function parseHttpRequest(request: string) {
        lastRequestMethod = ""
        lastRequestPath = ""
        lastRequestBody = ""

        let lineEnd = request.indexOf("\r\n")
        if (lineEnd < 0) lineEnd = request.indexOf("\n")

        let requestLine = request
        if (lineEnd >= 0) {
            requestLine = request.substr(0, lineEnd)
        }

        let lineParts = requestLine.split(" ")
        if (lineParts.length >= 2) {
            lastRequestMethod = lineParts[0]
            lastRequestPath = lineParts[1]
        }

        let bodyStart = request.indexOf("\r\n\r\n")
        if (bodyStart >= 0) {
            lastRequestBody = request.substr(bodyStart + 4)
        }
    }

    function sendHttpResponse(linkId: number) {
        if (linkId < 0) return

        let statusText = "OK"
        switch (webResponseStatusCode) {
            case 200: statusText = "OK"; break
            case 201: statusText = "Created"; break
            case 400: statusText = "Bad Request"; break
            case 404: statusText = "Not Found"; break
            case 500: statusText = "Internal Server Error"; break
            default: statusText = "OK"; break
        }

        let response = "HTTP/1.1 " + webResponseStatusCode + " " + statusText + "\r\n"
        response += "Content-Type: text/plain\r\n"
        response += "Connection: close\r\n"
        response += "Content-Length: " + webResponseMessage.length + "\r\n\r\n"
        response += webResponseMessage

        if (sendCommand("AT+CIPSEND=" + linkId + "," + response.length, "OK", 1000) == false) {
            sendCommand("AT+CIPCLOSE=" + linkId, "OK", 1000)
            return
        }

        sendCommand(response)
        getResponse("SEND OK", 1000)
        sendCommand("AT+CIPCLOSE=" + linkId, "OK", 1000)
    }
}
