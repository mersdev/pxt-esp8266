/*******************************************************************************
 * Functions for Velozz
 *
 * Company: Cytron Technologies Sdn Bhd
 * Website: http://www.cytron.io
 * Email:   support@cytron.io
 *******************************************************************************/

// Velozz API url.
// IMPORTANT: Do not put https:// here.
const VELOZZ_API_URL = "microbit-backend.velozz.workers.dev"

namespace esp8266 {
    // Flag to indicate whether the Velozz request completed successfully.
    let velozzUpdated = false

    // Debug message for troubleshooting.
    let velozzDebug = "NO_DEBUG_YET"

    // Last parsed Velozz response fields.
    let velozzLastOk = ""
    let velozzLastType = ""
    let velozzLastCommandId = ""
    let velozzLastName = ""
    let velozzLastValue = ""

    /**
     * Fields available from the last Velozz response.
     */
    export enum VelozzLastField {
        //% block="OK status"
        Ok,
        //% block="response type"
        Type,
        //% block="command ID"
        CommandId,
        //% block="field name"
        Name,
        //% block="field value"
        Value
    }



    /**
     * Return true if Velozz data was updated successfully.
     */
    //% subcategory="Velozz"
    //% weight=40
    //% blockGap=8
    //% blockId=esp8266_is_velozz_data_updated
    //% block="Velozz request successful"
    export function isVelozzUpdated(): boolean {
        return velozzUpdated
    }



    /**
     * Return last Velozz debug message.
     */
    //% subcategory="Velozz"
    //% weight=39
    //% blockGap=8
    //% blockId=esp8266_velozz_debug
    //% block="Velozz debug message"
    export function getVelozzDebug(): string {
        return velozzDebug
    }



    /**
     * Return last Velozz response type.
     */
    //% subcategory="Velozz"
    //% blockHidden=true
    export function getVelozzLastType(): string {
        return velozzLastType
    }



    /**
     * Return last Velozz command ID.
     */
    //% subcategory="Velozz"
    //% blockHidden=true
    export function getVelozzLastCommandId(): string {
        return velozzLastCommandId
    }



    /**
     * Return last Velozz command/event name.
     */
    //% subcategory="Velozz"
    //% blockHidden=true
    export function getVelozzLastName(): string {
        return velozzLastName
    }



    /**
     * Return last Velozz command/event value.
     */
    //% subcategory="Velozz"
    //% blockHidden=true
    export function getVelozzLastValue(): string {
        return velozzLastValue
    }



    /**
     * Return a field from the last Velozz response.
     */
    //% subcategory="Velozz"
    //% weight=35
    //% blockGap=8
    //% blockId=esp8266_velozz_last_field
    //% block="last Velozz response field %field"
    export function getVelozzLastField(field: VelozzLastField): string {
        if (field == VelozzLastField.Ok) return velozzLastOk
        if (field == VelozzLastField.Type) return velozzLastType
        if (field == VelozzLastField.CommandId) return velozzLastCommandId
        if (field == VelozzLastField.Name) return velozzLastName
        if (field == VelozzLastField.Value) return velozzLastValue
        return ""
    }



    function setVelozzDebug(status: string, detail: string = null) {
        if ((detail == null) || (detail == "")) {
            velozzDebug = status
        } else {
            velozzDebug = status + "|" + detail
        }
    }



    function clearVelozzLastFields() {
        velozzLastOk = ""
        velozzLastType = ""
        velozzLastCommandId = ""
        velozzLastName = ""
        velozzLastValue = ""
    }



    function extractJsonValueField(body: string, field: string): string {
        let pattern = "\"" + field + "\":"
        let start = body.indexOf(pattern)
        if (start < 0) return ""

        start += pattern.length

        while (start < body.length && body.charAt(start) == " ") {
            start++
        }

        if (start >= body.length) return ""

        if (body.charAt(start) == "\"") {
            start++
            let end = start
            while (end < body.length) {
                if (body.charAt(end) == "\"" && body.charAt(end - 1) != "\\") {
                    return body.slice(start, end)
                }
                end++
            }
            return ""
        }

        let end = start
        while (end < body.length && body.charAt(end) != "," && body.charAt(end) != "}") {
            end++
        }

        return body.slice(start, end).trim()
    }



    function parseVelozzResponseFields(body: string) {
        velozzLastOk = extractJsonValueField(body, "ok")
        velozzLastType = extractJsonValueField(body, "type")
        velozzLastCommandId = extractJsonValueField(body, "cmdId")
        velozzLastName = extractJsonValueField(body, "name")
        velozzLastValue = extractJsonValueField(body, "value")
    }



    /**
     * Prepare ESP8266 SSL settings before connecting to Cloudflare Worker.
     */
    function prepareVelozzSsl() {
        // Force single connection mode.
        sendCommand("AT+CIPMUX=0", "OK", 1000)

        // Disable transparent mode.
        sendCommand("AT+CIPMODE=0", "OK", 1000)

        // Close previous connection if any.
        sendCommand("AT+CIPCLOSE", "OK", 1000)

        // Disable certificate verification.
        // Some ESP8266 firmware may not support this command.
        // It is okay if this command fails.
        sendCommand("AT+CIPSSLCCONF=0", "OK", 2000)

        // Set SNI for Cloudflare / workers.dev.
        // Some ESP8266 firmware may not support this command.
        // It is okay if this command fails, but if supported, it helps SSL connection.
        sendCommand("AT+CIPSSLCSNI=\"" + VELOZZ_API_URL + "\"", "OK", 2000)
    }



    /**
     * Open SSL connection to Velozz backend.
     */
    function openVelozzConnection(): boolean {
        prepareVelozzSsl()

        // SSL handshake may be slow, so use 30 seconds.
        return sendCommand("AT+CIPSTART=\"SSL\",\"" + VELOZZ_API_URL + "\",443", "OK", 30000)
    }



    /**
     * Send an HTTP request to Velozz over the already-open connection.
     */
    function sendVelozzRequest(data: string): boolean {
        if (sendCommand("AT+CIPSEND=" + (data.length + 2), "OK", 5000) == false) {
            setVelozzDebug("ERR_CIPSEND_NOT_READY")
            return false
        }

        sendCommand(data)

        if (getResponse("SEND OK", 5000) == "") {
            setVelozzDebug("ERR_NO_SEND_OK")
            return false
        }

        return true
    }



    /**
     * Read the HTTP response body from Velozz and update the debug string.
     */
    function readVelozzResponse(okDebug: string, emptyBodyDebug: string): string {
        let status = getResponse("HTTP/", 8000)
        if (status == "") {
            setVelozzDebug("ERR_NO_HTTP_STATUS")
            return ""
        }

        if (status.includes("200") == false) {
            setVelozzDebug("ERR_HTTP_STATUS", status)
            return ""
        }

        let body = ""
        while (true) {
            let line = getResponse("", 300)
            if (line == "") {
                break
            }

            let jsonStart = line.indexOf("{")
            if (jsonStart >= 0) {
                body = line.slice(jsonStart)
                continue
            }

            if (line == "CLOSED") {
                continue
            }
        }

        if (body == "") {
            setVelozzDebug(emptyBodyDebug, status)
            return ""
        }

        setVelozzDebug(okDebug, body)
        return body
    }



    /**
     * Test whether ESP8266 can open SSL connection to Velozz backend.
     * This only checks connection to backend host, not API key.
     */
    //% subcategory="Velozz"
    //% weight=38
    //% blockGap=8
    //% blockId=esp8266_test_velozz_connection
    //% block="check Velozz backend connection"
    export function testVelozzConnection1(): boolean {
        velozzUpdated = false
        clearVelozzLastFields()
        setVelozzDebug("START_CONNECTION_TEST")

        if (isWifiConnected() == false) {
            setVelozzDebug("ERR_WIFI_NOT_CONNECTED")
            return false
        }

        if (openVelozzConnection() == false) {
            setVelozzDebug("ERR_SSL_CONNECT_FAILED")
            return false
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)

        velozzUpdated = true
        setVelozzDebug("OK_SSL_CONNECTED")
        return true
    }



    /**
     * Test whether Velozz backend route can respond using API key.
     * This calls /v1/microbit/heartbeat.
     * @param apiKey Device ID / API key.
     */
    //% subcategory="Velozz"
    //% weight=37
    //% blockGap=8
    //% blockId=esp8266_test_velozz_backend
    //% block="check Velozz backend: API key %apiKey"
    export function testVelozzBackend(apiKey: string): boolean {
        velozzUpdated = false
        clearVelozzLastFields()
        setVelozzDebug("START_BACKEND_TEST")

        if (isWifiConnected() == false) {
            setVelozzDebug("ERR_WIFI_NOT_CONNECTED")
            return false
        }

        if (openVelozzConnection() == false) {
            setVelozzDebug("ERR_SSL_CONNECT_FAILED")
            return false
        }

        let data = "GET /v1/microbit/heartbeat?deviceId=" + apiKey + " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"
        data += "Connection: close\r\n"

        if (sendVelozzRequest(data) == false) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return false
        }

        let response = readVelozzResponse("OK_BACKEND_RESPONSE", "ERR_NO_BACKEND_RESPONSE")
        parseVelozzResponseFields(response)

        if (response.includes("\"ok\":true")) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)

            velozzUpdated = true
            return true
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)
        setVelozzDebug("ERR_BACKEND_RESPONSE", response)
        return false
    }



    /**
     * Pull data from Velozz and return the response string.
     * @param apiKey Device ID / API key.
     */
    //% subcategory="Velozz"
    //% weight=36
    //% blockGap=8
    //% blockId=esp8266_pull_velozz
    //% block="pull data from Velozz: API key %apiKey"
    export function pullVelozz(apiKey: string) {

        velozzUpdated = false
        clearVelozzLastFields()
        setVelozzDebug("START_PULL")

        if (isWifiConnected() == false) {
            setVelozzDebug("ERR_WIFI_NOT_CONNECTED")
            return
        }

        if (openVelozzConnection() == false) {
            setVelozzDebug("ERR_SSL_CONNECT_FAILED")
            return
        }

        let data = "GET /v1/microbit/pull?deviceId=" + apiKey + " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"
        data += "Connection: close\r\n"

        if (sendVelozzRequest(data) == false) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        let response = readVelozzResponse("OK_PULL_RESPONSE", "ERR_NO_PULL_RESPONSE")
        parseVelozzResponseFields(response)

        if (response.includes("\"ok\":true")) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            velozzUpdated = true
            return
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)
        setVelozzDebug("ERR_PULL_RESPONSE", response)
        return
    }



    /**
     * Send data to Velozz.
     * @param apiKey Device ID / API key.
     * @param name Value name to send.
     * @param value Value to send.
     */
    //% subcategory="Velozz"
    //% weight=35
    //% blockGap=8
    //% blockId=esp8266_send_velozz
    //% block="send data to Velozz: API key %apiKey Field name %name Field value %value"
    export function sendVelozz(apiKey: string, name: string, value: string) {
        velozzUpdated = false
        clearVelozzLastFields()
        setVelozzDebug("START_SEND")

        if (isWifiConnected() == false) {
            setVelozzDebug("ERR_WIFI_NOT_CONNECTED")
            return
        }

        if (openVelozzConnection() == false) {
            setVelozzDebug("ERR_SSL_CONNECT_FAILED")
            return
        }

        let data = "GET /v1/microbit/send?deviceId=" + apiKey
        data += "&name=" + formatUrl(name)
        data += "&value=" + formatUrl(value)
        data += " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"
        data += "Connection: close\r\n"

        if (sendVelozzRequest(data) == false) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        let response = readVelozzResponse("OK_SEND_RESPONSE", "ERR_NO_SEND_RESPONSE")
        parseVelozzResponseFields(response)

        if (response.includes("\"ok\":true")) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            velozzUpdated = true
            return
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)
        setVelozzDebug("ERR_SEND_RESPONSE", response)
        return
    }



    /**
     * Send ACK to Velozz after command is completed.
     * @param apiKey Device ID / API key.
     * @param cmdId Command ID from pull response.
     */
    //% subcategory="Velozz"
    //% weight=34
    //% blockGap=8
    //% blockId=esp8266_ack_velozz
    //% block="acknowledge Velozz command: API key %apiKey Command ID %cmdId"
    export function ackVelozz(apiKey: string, cmdId: string) {
        velozzUpdated = false
        clearVelozzLastFields()
        setVelozzDebug("START_ACK")

        if (isWifiConnected() == false) {
            setVelozzDebug("ERR_WIFI_NOT_CONNECTED")
            return
        }

        if (openVelozzConnection() == false) {
            setVelozzDebug("ERR_SSL_CONNECT_FAILED")
            return
        }

        let data = "GET /v1/microbit/ack?deviceId=" + apiKey
        data += "&cmdId=" + cmdId
        data += " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"
        data += "Connection: close\r\n"

        if (sendVelozzRequest(data) == false) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        let response = readVelozzResponse("OK_ACK_RESPONSE", "ERR_NO_ACK_RESPONSE")
        parseVelozzResponseFields(response)

        if (response.includes("\"ok\":true")) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            velozzUpdated = true
            return
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)
        setVelozzDebug("ERR_ACK_RESPONSE", response)
        return
    }
}
