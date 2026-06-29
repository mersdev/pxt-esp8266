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
    let velozzDebug = ""



    /**
     * Return true if Velozz data was updated successfully.
     */
    //% subcategory="Velozz"
    //% weight=34
    //% blockGap=8
    //% blockId=esp8266_is_velozz_data_updated
    //% block="Velozz updated"
    export function isVelozzUpdated(): boolean {
        return velozzUpdated
    }



    /**
     * Return last Velozz debug message.
     */
    //% subcategory="Velozz"
    //% weight=33
    //% blockGap=8
    //% blockId=esp8266_velozz_debug
    //% block="Velozz debug"
    export function getVelozzDebug(): string {
        return velozzDebug
    }



    /**
     * Test whether ESP8266 can open SSL connection to Velozz backend.
     * This only checks connection to backend host, not API key.
     */
    //% subcategory="Velozz"
    //% weight=32
    //% blockGap=8
    //% blockId=esp8266_test_velozz_connection
    //% block="test Velozz backend connection"
    export function testVelozzConnection(): boolean {
        velozzUpdated = false
        velozzDebug = "START_CONNECTION_TEST"

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) {
            velozzDebug = "ERR_WIFI_NOT_CONNECTED"
            return false
        }

        // Same style as Cytron Telegram.
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + VELOZZ_API_URL + "\",443", "OK", 10000) == false) {
            velozzDebug = "ERR_SSL_CONNECT_FAILED"
            return false
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)

        velozzUpdated = true
        velozzDebug = "OK_SSL_CONNECTED"
        return true
    }



    /**
     * Test whether Velozz backend route can respond using API key.
     * This calls /v1/microbit/heartbeat.
     * @param apiKey Device ID / API key.
     */
    //% subcategory="Velozz"
    //% weight=31
    //% blockGap=8
    //% blockId=esp8266_test_velozz_backend
    //% block="test Velozz backend: API Key %apiKey"
    export function testVelozzBackend(apiKey: string): boolean {
        velozzUpdated = false
        velozzDebug = "START_BACKEND_TEST"

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) {
            velozzDebug = "ERR_WIFI_NOT_CONNECTED"
            return false
        }

        // Same style as Cytron Telegram.
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + VELOZZ_API_URL + "\",443", "OK", 10000) == false) {
            velozzDebug = "ERR_SSL_CONNECT_FAILED"
            return false
        }

        let data = "GET /v1/microbit/heartbeat?deviceId=" + formatUrl(apiKey) + " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"
        data += "Connection: close\r\n"

        // Same style as Cytron Telegram.
        // Do not wait for ">".
        sendCommand("AT+CIPSEND=" + (data.length + 2))
        sendCommand(data)

        // Check whether request was sent.
        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            velozzDebug = "ERR_NO_SEND_OK"
            return false
        }

        // New Telegram-style backend response:
        // {"ok":true,...}
        let response = getResponse("\"ok\":true", 5000)

        if (response != "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)

            velozzUpdated = true
            velozzDebug = "OK_BACKEND_RESPONSE"
            return true
        }

        // Fallback for old backend response:
        // OK|LEFT=...
        response = getResponse("OK|LEFT", 2000)

        if (response != "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)

            velozzUpdated = true
            velozzDebug = "OK_BACKEND_OLD_FORMAT"
            return true
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)

        velozzDebug = "ERR_NO_BACKEND_RESPONSE"
        return false
    }



    /**
     * Pull data from Velozz and return the response body/string.
     * @param apiKey Device ID / API key.
     */
    //% subcategory="Velozz"
    //% weight=30
    //% blockGap=8
    //% blockId=esp8266_pull_velozz
    //% block="pull Velozz: API Key %apiKey"
    export function pullVelozz(apiKey: string): string {
        let value = ""

        velozzUpdated = false
        velozzDebug = "START_PULL"

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) {
            velozzDebug = "ERR_WIFI_NOT_CONNECTED"
            return value
        }

        // Same style as Cytron Telegram.
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + VELOZZ_API_URL + "\",443", "OK", 10000) == false) {
            velozzDebug = "ERR_SSL_CONNECT_FAILED"
            return value
        }

        let data = "GET /v1/microbit/pull?deviceId=" + formatUrl(apiKey) + " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"
        data += "Connection: close\r\n"

        // Same style as Cytron Telegram.
        // Do not wait for ">".
        sendCommand("AT+CIPSEND=" + (data.length + 2))
        sendCommand(data)

        // Return if "SEND OK" is not received.
        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            velozzDebug = "ERR_NO_SEND_OK"
            return value
        }

        // New Telegram-style response:
        // {"ok":true,...}
        let response = getResponse("\"ok\":true", 5000)

        if (response != "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)

            velozzUpdated = true
            velozzDebug = "OK_PULL_JSON"
            return response
        }

        // Fallback for old backend response:
        // NONE|POLL=...
        response = getResponse("NONE|", 2000)

        if (response != "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)

            velozzUpdated = true
            velozzDebug = "OK_PULL_NONE_OLD_FORMAT"
            return response
        }

        // Fallback for old backend command response:
        // CMD|cmdId=...
        response = getResponse("CMD|", 2000)

        if (response != "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)

            velozzUpdated = true
            velozzDebug = "OK_PULL_CMD_OLD_FORMAT"
            return response
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)

        velozzDebug = "ERR_NO_PULL_RESPONSE"
        return value
    }



    /**
     * Send data to Velozz.
     * @param apiKey Device ID / API key.
     * @param name Value name to send.
     * @param value Value to send.
     */
    //% subcategory="Velozz"
    //% weight=29
    //% blockGap=8
    //% blockId=esp8266_send_velozz
    //% block="send to Velozz: API Key %apiKey Name %name Value %value"
    export function sendVelozz(apiKey: string, name: string, value: string) {
        velozzUpdated = false
        velozzDebug = "START_SEND"

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) {
            velozzDebug = "ERR_WIFI_NOT_CONNECTED"
            return
        }

        // Same style as Cytron Telegram.
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + VELOZZ_API_URL + "\",443", "OK", 10000) == false) {
            velozzDebug = "ERR_SSL_CONNECT_FAILED"
            return
        }

        let data = "GET /v1/microbit/send?deviceId=" + formatUrl(apiKey)
        data += "&name=" + formatUrl(name)
        data += "&value=" + formatUrl(value)
        data += " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"
        data += "Connection: close\r\n"

        // Same style as Cytron Telegram.
        // Do not wait for ">".
        sendCommand("AT+CIPSEND=" + (data.length + 2))
        sendCommand(data)

        // Return if "SEND OK" is not received.
        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            velozzDebug = "ERR_NO_SEND_OK"
            return
        }

        // New Telegram-style response:
        // {"ok":true,...}
        let response = getResponse("\"ok\":true", 5000)

        if (response != "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)

            velozzUpdated = true
            velozzDebug = "OK_SEND_JSON"
            return
        }

        // Fallback for old backend response:
        // OK|LEFT=...
        response = getResponse("OK|LEFT", 2000)

        if (response != "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)

            velozzUpdated = true
            velozzDebug = "OK_SEND_OLD_FORMAT"
            return
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)

        velozzDebug = "ERR_NO_SEND_RESPONSE"
        return
    }



    /**
     * Send ACK to Velozz after command is completed.
     * @param apiKey Device ID / API key.
     * @param cmdId Command ID from pull response.
     */
    //% subcategory="Velozz"
    //% weight=28
    //% blockGap=8
    //% blockId=esp8266_ack_velozz
    //% block="ack Velozz: API Key %apiKey Command ID %cmdId"
    export function ackVelozz(apiKey: string, cmdId: string) {
        velozzUpdated = false
        velozzDebug = "START_ACK"

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) {
            velozzDebug = "ERR_WIFI_NOT_CONNECTED"
            return
        }

        // Same style as Cytron Telegram.
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + VELOZZ_API_URL + "\",443", "OK", 10000) == false) {
            velozzDebug = "ERR_SSL_CONNECT_FAILED"
            return
        }

        let data = "GET /v1/microbit/ack?deviceId=" + formatUrl(apiKey)
        data += "&cmdId=" + formatUrl(cmdId)
        data += " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"
        data += "Connection: close\r\n"

        // Same style as Cytron Telegram.
        // Do not wait for ">".
        sendCommand("AT+CIPSEND=" + (data.length + 2))
        sendCommand(data)

        // Return if "SEND OK" is not received.
        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            velozzDebug = "ERR_NO_SEND_OK"
            return
        }

        // New Telegram-style response:
        // {"ok":true,...}
        let response = getResponse("\"ok\":true", 5000)

        if (response != "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)

            velozzUpdated = true
            velozzDebug = "OK_ACK_JSON"
            return
        }

        // Fallback for old backend response:
        // OK|LEFT=...
        response = getResponse("OK|LEFT", 2000)

        if (response != "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)

            velozzUpdated = true
            velozzDebug = "OK_ACK_OLD_FORMAT"
            return
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)

        velozzDebug = "ERR_NO_ACK_RESPONSE"
        return
    }
}