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
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + VELOZZ_API_URL + "\",443", "OK", 10000) == false) return value

        // Construct the data to send.
        let data = "GET /v1/microbit/pull?deviceId=" + formatUrl(apiKey) + " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"

        // Send the data.
        sendCommand("AT+CIPSEND=" + (data.length + 2), "OK")
        console.log("> " + data.slice(0, data.indexOf("\r\n")))
        sendCommand(data)

        // Return if "SEND OK" is not received.
        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return value
        }

        // Make sure Velozz response is 200.
        if (getResponse("HTTP/1.1", 5000).includes("200 OK")) {

            // Get the response body.
            // It should be the last line in the response.
            while (true) {
                let response = getResponse("", 200)
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
        if (sendCommand("AT+CIPSTART=\"SSL\",\"" + VELOZZ_API_URL + "\",443", "OK", 10000) == false) return

        // Construct the data to send.
        let data = "GET /v1/microbit/send?deviceId=" + formatUrl(apiKey) + "&name=" + formatUrl(name) + "&value=" + formatUrl(value) + " HTTP/1.1\r\n"
        data += "Host: " + VELOZZ_API_URL + "\r\n"

        // Send the data.
        sendCommand("AT+CIPSEND=" + (data.length + 2), "OK")
        console.log("> " + data.slice(0, data.indexOf("\r\n")))
        sendCommand(data)

        // Return if "SEND OK" is not received.
        if (getResponse("SEND OK", 5000) == "") {
            sendCommand("AT+CIPCLOSE", "OK", 1000)
            return
        }

        // Validate the response from Velozz.
        if (getResponse("HTTP/1.1", 5000).includes("200 OK")) {
            velozzUpdated = true
        }

        // Close the connection.
        sendCommand("AT+CIPCLOSE", "OK", 1000)
        return
    }
}
