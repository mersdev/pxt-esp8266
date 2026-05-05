/*******************************************************************************
 * Functions for Web API
 *
 * Company: Cytron Technologies Sdn Bhd
 * Website: http://www.cytron.io
 * Email:   support@cytron.io
 *******************************************************************************/

// Web API server.
const WEB_API_URL = "backend.whalo8040.workers.dev"

namespace esp8266 {
    // Flag to indicate whether the Web request was completed successfully.
    let webUpdated = false
    // Debug buffer for latest raw response captured from ESP8266.
    let webLastRawResponse = ""
    let webLastHttpStatus = ""
    let webLastDebugStep = "IDLE"
    let webLastDebugCode = 0
    let webLastBody = ""

    /**
     * Return true if the latest Web request is successful.
     */
    //% subcategory="Web"
    //% weight=30
    //% blockGap=8
    //% blockId=esp8266_is_web_updated
    //% block="Web request successful"
    export function isWebUpdated(): boolean {
        return webUpdated
    }

    /**
     * Return the latest raw response captured from receiveFromWebApp.
     */
    //% subcategory="Web"
    //% weight=27
    //% blockGap=8
    //% blockId=esp8266_get_web_last_raw_response
    //% block="Web last raw response"
    export function getWebLastRawResponse(): string {
        return webLastRawResponse
    }

    /**
     * Return the latest HTTP status line captured from receiveFromWebApp.
     */
    //% subcategory="Web"
    //% weight=26
    //% blockGap=8
    //% blockId=esp8266_get_web_last_http_status
    //% block="Web last HTTP status"
    export function getWebLastHttpStatus(): string {
        return webLastHttpStatus
    }

    /**
     * Return the latest debug step for Web polling.
     */
    //% subcategory="Web"
    //% weight=25
    //% blockGap=8
    //% blockId=esp8266_get_web_last_debug_step
    //% block="Web last debug step"
    export function getWebLastDebugStep(): string {
        return webLastDebugStep
    }

    /**
     * Return the latest numeric debug code for Web polling.
     */
    //% subcategory="Web"
    //% weight=24
    //% blockGap=8
    //% blockId=esp8266_get_web_last_debug_code
    //% block="Web last debug code"
    export function getWebLastDebugCode(): number {
        return webLastDebugCode
    }

    /**
     * Return parsed Web response body from last poll.
     */
    //% subcategory="Web"
    //% weight=23
    //% blockGap=8
    //% blockId=esp8266_get_web_last_body
    //% block="Web last body"
    export function getWebLastBody(): string {
        return webLastBody
    }

    /**
     * Poll latest command from web app.
     * @param apiKey API key for x-api-key header.
     * @param pin Pin identifier to poll. eg: motor1
     */
    //% subcategory="Web"
    //% weight=29
    //% blockGap=8
    //% blockId=esp8266_receive_from_web_app
    //% block="Web poll command: API key %apiKey Pin %pin"
    export function receiveFromWebApp(apiKey: string, pin: string): string {
        let action = "NONE"

        // Reset the request successful flag.
        webUpdated = false
        webLastRawResponse = ""
        webLastHttpStatus = ""
        webLastDebugStep = "START"
        webLastDebugCode = 1
        webLastBody = ""

        // Connect to backend.
        if (sendCommand("AT+CIPSTART=\"TCP\",\"" + WEB_API_URL + "\",80", "OK", 5000) == true) {

            // Construct the data to send.
            let data = "GET /api/microbit/receiveFromWebApp?pin=" + formatUrl(pin) + " HTTP/1.1\r\n"
            data += "Host: " + WEB_API_URL + "\r\n"
            data += "x-api-key: " + apiKey + "\r\n"
            data += "accept: text/plain\r\n"
            data += "\r\n"

            // Send the data.
            sendCommand("AT+CIPSEND=" + (data.length + 2), "OK")
            sendCommand(data)
            webLastDebugStep = "REQUEST_SENT"
            webLastDebugCode = 4

            // Verify if "SEND OK" is received.
            if (getResponse("SEND OK", 5000) != "") {
                webLastDebugStep = "SEND_OK"
                webLastDebugCode = 6

                // Make sure response is 200.
                webLastHttpStatus = getResponse("HTTP/1.1", 5000)
                if (webLastHttpStatus.includes("200 OK")) {
                    webLastDebugStep = "HTTP_200"
                    webLastDebugCode = 8

                    // Get the action.
                    // It should be the last line in the response.
                    while (true) {
                        let response = getResponse("", 200)
                        if (response == "") {
                            break
                        } else {
                            webLastRawResponse += response + "\r\n"
                            if (!response.includes("HTTP/") && !response.includes(":") && response != "CLOSED") {
                                action = response.trim()
                            }
                        }
                    }

                    webLastBody = action
                    webLastDebugStep = "PARSED_" + action
                    webLastDebugCode = 9

                    // Set the successful flag.
                    webUpdated = true
                } else {
                    webLastDebugStep = "HTTP_NOT_200"
                    webLastDebugCode = 7
                }
            } else {
                webLastDebugStep = "SEND_FAIL"
                webLastDebugCode = 5
            }
        } else {
            webLastDebugStep = "CIPSTART_FAIL"
            webLastDebugCode = 2
        }

        // Close the connection.
        sendCommand("AT+CIPCLOSE", "OK", 1000)
        webLastDebugStep = "DONE"
        webLastDebugCode = 10

        return action
    }

    /**
     * Push sensor value to web app.
     * @param apiKey API key for x-api-key header.
     * @param pin Pin identifier. eg: POP1
     * @param value Value we want to send.
     */
    //% subcategory="Web"
    //% weight=28
    //% blockGap=8
    //% blockId=esp8266_send_to_web_app
    //% block="Web send value: API key %apiKey Pin %pin Value %value"
    export function sendToWebApp(apiKey: string, pin: string, value: string) {
        // Reset the request successful flag.
        webUpdated = false

        if (sendCommand("AT+CIPSTART=\"TCP\",\"" + WEB_API_URL + "\",80", "OK", 10000) == false) return

        let endpoint = "/api/microbit/sendToWebApp?pin=" + formatUrl(pin) + "&value=" + formatUrl(value)
        let data = "GET " + endpoint + " HTTP/1.1\r\n"
        data += "Host: " + WEB_API_URL + "\r\n"
        data += "Connection: close\r\n"
        data += "x-api-key: " + apiKey + "\r\n"
        data += "\r\n"

        sendCommand("AT+CIPSEND=" + (data.length + 2), "OK")
        sendCommand(data)

        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        if (getResponse("HTTP/1.1", 5000).includes("200") == false) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)

        webUpdated = true
        return
    }

    /**
     * Publish action to web app for a pin.
     * @param apiKey API key for x-api-key header.
     * @param pin Pin identifier. eg: motor1
     * @param action Action we want to publish. eg: FORWARD
     */
    //% subcategory="Web"
    //% weight=27
    //% blockGap=8
    //% blockId=esp8266_publish_action_to_web_app
    //% block="Web publish action: API key %apiKey Pin %pin Action %action"
    export function publishActionToWebApp(apiKey: string, pin: string, action: string) {
        // Reset the request successful flag.
        webUpdated = false

        if (sendCommand("AT+CIPSTART=\"TCP\",\"" + WEB_API_URL + "\",80", "OK", 10000) == false) return

        let endpoint = "/api/microbit/publishAction?pin=" + formatUrl(pin) + "&action=" + formatUrl(action)
        let data = "GET " + endpoint + " HTTP/1.1\r\n"
        data += "Host: " + WEB_API_URL + "\r\n"
        data += "Connection: close\r\n"
        data += "x-api-key: " + apiKey + "\r\n"
        data += "\r\n"

        sendCommand("AT+CIPSEND=" + (data.length + 2), "OK")
        sendCommand(data)

        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        if (getResponse("HTTP/1.1", 5000).includes("200") == false) {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        sendCommand("AT+CIPCLOSE", "OK", 1000)

        webUpdated = true
        return
    }
}
