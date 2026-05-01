/*******************************************************************************
 * Functions for HTTP GET web server.
 *
 * Company: Cytron Technologies Sdn Bhd
 * Website: http://www.cytron.io
 * Email:   support@cytron.io
 *******************************************************************************/

namespace esp8266 {
    let webServerRunning = false
    let webRequestReceived = false

    // Route settings.
    let inputRoutePath = "/input"
    let outputRoutePath = "/output"
    let healthRoutePath = "/health"

    // Query key settings.
    let inputSensorKey = "sensor"
    let inputValueKey = "value"
    let outputSensorKey = "sensor"
    let outputActionKey = "action"

    // Last parsed values.
    let lastMethod = ""
    let lastPath = ""
    let lastRawQuery = ""
    let lastSensor = ""
    let lastValue = ""
    let lastAction = ""
    let lastRouteType = ""

    // Custom responses.
    let inputResponse = "INPUT OK"
    let outputResponse = "OUTPUT OK"
    let healthResponse = "UP"
    let errorResponse = "BAD REQUEST"

    // Internal parser state.
    let webLinkId = -1
    let webRxData = ""

    //% subcategory="Web Server"
    //% weight=40
    //% blockGap=8
    //% blockId=esp8266_is_web_server_running
    //% block="web server running"
    export function isWebServerRunning(): boolean {
        return webServerRunning
    }

    //% subcategory="Web Server"
    //% weight=39
    //% blockGap=8
    //% blockId=esp8266_start_web_server
    //% block="start web server at port %port"
    //% port.min=1 port.max=65535
    export function startWebServer(port: number = 80) {
        webServerRunning = false
        if (isWifiConnected() == false) return

        sendCommand("AT+CIPSERVER=0", "OK", 1000)
        if (sendCommand("AT+CIPMUX=1", "OK", 1000) == false) return
        if (sendCommand("AT+CIPSERVER=1," + port, "OK", 2000) == false) return

        webServerRunning = true
    }

    //% subcategory="Web Server"
    //% weight=38
    //% blockGap=8
    //% blockId=esp8266_stop_web_server
    //% block="stop web server"
    export function stopWebServer() {
        if (sendCommand("AT+CIPSERVER=0", "OK", 2000) == false) {
            webServerRunning = false
            return
        }

        sendCommand("AT+CIPMUX=0", "OK", 1000)
        webServerRunning = false
    }

    //% subcategory="Web Server"
    //% weight=37
    //% blockGap=8
    //% blockId=esp8266_configure_input_route
    //% block="set input route %path sensor key %sensorKey value key %valueKey"
    export function configureInputRoute(path: string, sensorKey: string = "sensor", valueKey: string = "value") {
        inputRoutePath = path
        inputSensorKey = sensorKey
        inputValueKey = valueKey
    }

    //% subcategory="Web Server"
    //% weight=36
    //% blockGap=8
    //% blockId=esp8266_configure_output_route
    //% block="set output route %path sensor key %sensorKey action key %actionKey"
    export function configureOutputRoute(path: string, sensorKey: string = "sensor", actionKey: string = "action") {
        outputRoutePath = path
        outputSensorKey = sensorKey
        outputActionKey = actionKey
    }

    //% subcategory="Web Server"
    //% weight=35
    //% blockGap=8
    //% blockId=esp8266_set_webserver_response
    //% block="set response input %inputMsg output %outputMsg health %healthMsg error %errorMsg"
    export function setWebServerResponse(inputMsg: string, outputMsg: string, healthMsg: string = "UP", errorMsg: string = "BAD REQUEST") {
        inputResponse = inputMsg
        outputResponse = outputMsg
        healthResponse = healthMsg
        errorResponse = errorMsg
    }

    //% subcategory="Web Server"
    //% weight=34
    //% blockGap=8
    //% blockId=esp8266_handle_web_get_request
    //% block="handle web GET request timeout(ms) %timeout"
    export function handleWebGetRequest(timeout: number = 100): boolean {
        webRequestReceived = false
        clearLastRequestValues()

        if (webServerRunning == false) return false

        let timestamp = input.runningTime()
        while (input.runningTime() - timestamp <= timeout) {
            webRxData += serial.readString()

            let request = extractHttpRequestFromBuffer()
            if (request != "") {
                parseHttpRequest(request)
                routeRequestAndRespond(webLinkId)
                webRequestReceived = true
                return true
            }

            basic.pause(5)
        }

        return false
    }

    //% subcategory="Web Server"
    //% weight=33
    //% blockGap=8
    //% blockId=esp8266_is_web_request_received
    //% block="web request received"
    export function isWebRequestReceived(): boolean {
        return webRequestReceived
    }

    //% subcategory="Web Server"
    //% weight=32
    //% blockGap=8
    //% blockId=esp8266_web_route_type
    //% block="last route type"
    export function lastRouteTypeWeb(): string {
        return lastRouteType
    }

    //% subcategory="Web Server"
    //% weight=31
    //% blockGap=8
    //% blockId=esp8266_web_method
    //% block="last method"
    export function lastWebMethod(): string {
        return lastMethod
    }

    //% subcategory="Web Server"
    //% weight=30
    //% blockGap=8
    //% blockId=esp8266_web_path
    //% block="last path"
    export function lastWebPath(): string {
        return lastPath
    }

    //% subcategory="Web Server"
    //% weight=29
    //% blockGap=8
    //% blockId=esp8266_web_query
    //% block="last query"
    export function lastWebQuery(): string {
        return lastRawQuery
    }

    //% subcategory="Web Server"
    //% weight=28
    //% blockGap=8
    //% blockId=esp8266_web_sensor
    //% block="last sensor"
    export function lastWebSensor(): string {
        return lastSensor
    }

    //% subcategory="Web Server"
    //% weight=27
    //% blockGap=8
    //% blockId=esp8266_web_value
    //% block="last value"
    export function lastWebValue(): string {
        return lastValue
    }

    //% subcategory="Web Server"
    //% weight=26
    //% blockGap=40
    //% blockId=esp8266_web_action
    //% block="last action"
    export function lastWebAction(): string {
        return lastAction
    }

    function clearLastRequestValues() {
        lastMethod = ""
        lastPath = ""
        lastRawQuery = ""
        lastSensor = ""
        lastValue = ""
        lastAction = ""
        lastRouteType = ""
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

        let lineParts = requestLine.split(" ")
        if (lineParts.length < 2) return

        lastMethod = lineParts[0]
        let pathWithQuery = lineParts[1]

        let qPos = pathWithQuery.indexOf("?")
        if (qPos >= 0) {
            lastPath = pathWithQuery.substr(0, qPos)
            lastRawQuery = pathWithQuery.substr(qPos + 1)
        } else {
            lastPath = pathWithQuery
            lastRawQuery = ""
        }
    }

    function routeRequestAndRespond(linkId: number) {
        if (lastMethod != "GET") {
            sendHttpResponse(linkId, 405, "Method Not Allowed", errorResponse)
            return
        }

        if (lastPath == healthRoutePath) {
            lastRouteType = "health"
            sendHttpResponse(linkId, 200, "OK", healthResponse)
            return
        }

        if (lastPath == inputRoutePath) {
            lastRouteType = "input"
            lastSensor = getQueryValue(lastRawQuery, inputSensorKey)
            lastValue = getQueryValue(lastRawQuery, inputValueKey)
            sendHttpResponse(linkId, 200, "OK", inputResponse)
            return
        }

        if (lastPath == outputRoutePath) {
            lastRouteType = "output"
            lastSensor = getQueryValue(lastRawQuery, outputSensorKey)
            lastAction = getQueryValue(lastRawQuery, outputActionKey)
            sendHttpResponse(linkId, 200, "OK", outputResponse)
            return
        }

        lastRouteType = "unknown"
        sendHttpResponse(linkId, 404, "Not Found", errorResponse)
    }

    function getQueryValue(query: string, key: string): string {
        if ((query == "") || (key == "")) return ""

        let params = query.split("&")
        for (let i = 0; i < params.length; i++) {
            let pair = params[i].split("=")
            if (pair.length >= 2) {
                if (pair[0] == key) return pair[1]
            }
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

        if (sendCommand("AT+CIPSEND=" + linkId + "," + response.length, "OK", 1000) == false) {
            sendCommand("AT+CIPCLOSE=" + linkId, "OK", 1000)
            return
        }

        sendCommand(response)
        getResponse("SEND OK", 1000)
        sendCommand("AT+CIPCLOSE=" + linkId, "OK", 1000)
    }
}
