/*******************************************************************************
 * Functions for Velozz
 *
 * Company: Cytron Technologies Sdn Bhd
 * Website: http://www.cytron.io
 * Email:   support@cytron.io
 *******************************************************************************/

// Velozz API url.
const VELOZZ_API_URL = "microbit-backend.velozz.workers.dev"

namespace esp8266 {
    // Flag to indicate whether the Velozz request completed successfully.
    let velozzUpdated = false
    /**
     * Return true if Velozz data was updated successfully.
     */
    //% subcategory="Velozz"
    //% weight=30
    //% blockGap=8
    //% blockId=esp8266_is_velozz_data_updated
    //% block="Velozz updated"
    export function isVelozzUpdated(): boolean {
        return velozzUpdated
    }

    /**
     * Open SSL connection to Velozz.
     */
    function connectVelozz(): boolean {
        // Disable SSL certificate verification.
        // This is needed because ESP8266 usually does not have the CA cert loaded.
        sendCommand("AT+CIPSSLCCONF=0", "OK", 2000)

        // Set SNI for Cloudflare / workers.dev HTTPS.
        // Important for HTTPS backend such as *.workers.dev.
        sendCommand("AT+CIPSSLCSNI=\"" + VELOZZ_API_URL + "\"", "OK", 2000)

        // SSL handshake can be slow, so use longer timeout.
        return sendCommand("AT+CIPSTART=\"SSL\",\"" + VELOZZ_API_URL + "\",443", "OK", 30000)
    }



    /**
     * Pull data from Velozz and return the response body as string.
     * @param apiKey Device ID / API key.
     */
    //% subcategory="Velozz"
    //% weight=29
    //% blockGap=8
    //% blockId=esp8266_pull_velozz
    //% block="pull Velozz: API Key %apiKey"
    export function pullVelozz(apiKey: string): string {
        let value = ""

        // Reset the request successful flag.
        velozzUpdated = false

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) return value

        // Connect to Velozz. Return if failed.
        if (connectVelozz() == false) return value

        // Construct HTTP GET request.
        // IMPORTANT:
        // sendCommand(data) will add the final \r\n.
        // Therefore AT+CIPSEND uses data.length + 2.
        let data = "GET /v1/microbit/pull?deviceId=" + apiKey + " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"
        data += "Connection: close\r\n"

        // Send HTTP request.
        sendCommand("AT+CIPSEND=" + (data.length + 2), "OK", 5000)
        console.log("> " + data.slice(0, data.indexOf("\r\n")))
        sendCommand(data)

        // Return if "SEND OK" is not received.
        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return value
        }

        // Read HTTP status.
        let status = getResponse("HTTP/", 8000)

        // Make sure Velozz response is 200.
        if (status.includes("200")) {

            // Get the response body.
            // It should be the last non-empty line in the response.
            while (true) {
                let response = getResponse("", 300)

                if (response == "") {
                    break
                } else {
                    value = response
                }
            }

            // Set the request successful flag.
            velozzUpdated = true
        }

        // Close the connection.
        sendCommand("AT+CIPCLOSE", "OK", 1000)

        return value
    }



    /**
     * Send data to Velozz.
     * @param apiKey Device ID / API key.
     * @param name Value name to send.
     * @param value Value to send.
     */
    //% subcategory="Velozz"
    //% weight=28
    //% blockGap=8
    //% blockId=esp8266_send_velozz
    //% block="send to Velozz: API Key %apiKey Name %name Value %value"
    export function sendVelozz(apiKey: string, name: string, value: string) {

        // Reset the request successful flag.
        velozzUpdated = false

        // Make sure the WiFi is connected.
        if (isWifiConnected() == false) return

        // Connect to Velozz. Return if failed.
        if (connectVelozz() == false) return

        // Construct HTTP GET request.
        // IMPORTANT:
        // sendCommand(data) will add the final \r\n.
        // Therefore AT+CIPSEND uses data.length + 2.
        let data = "GET /v1/microbit/send?deviceId=" + apiKey + "&name=" + formatUrl(name) + "&value=" + formatUrl(value) + " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"
        data += "Connection: close\r\n"

        // Send HTTP request.
        sendCommand("AT+CIPSEND=" + (data.length + 2), "OK", 5000)
        console.log("> " + data.slice(0, data.indexOf("\r\n")))
        sendCommand(data)

        // Return if "SEND OK" is not received.
        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        // Read HTTP status.
        let status = getResponse("HTTP/", 8000)

        // Validate the response from Velozz.
        if (status.includes("200")) {
            velozzUpdated = true
        }

        // Close the connection.
        sendCommand("AT+CIPCLOSE", "OK", 1000)

        return
    }
}
