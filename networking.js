const STATUS_CODES = {
    "0000": "SUCCESS",
    "0001": "INVALID_ARGUMENTS",
    "0002": "REQUEST_HANDLING_ERROR",
    "0003": "DRIVER_IOCTL_ERROR",
    "0004": "UNKNOWN_REQUEST",
    "0005": "NOT_ENOUGH_ARGUMENTS",
    "0006": "INVALID_REQUEST_SYNTAX",
    "0007": "THREAD_CREATION_FAILED",
    "0050": "THREADED_ACTION",
    "0100": "UNSUCCESSFUL",
};

const user_response = document.getElementById("server_response");
const icon_symbol = document.getElementById("response_icon");

async function invokeRequest(message, prepend_hash = true) {
    await invokeRequestInner(message, prepend_hash);
    domRejitterIcons();
    domFlashResponse();
}

async function invokeRequestInner(message, prepend_hash = true) {
    const ip = document.getElementById("ipInput").value;
    const port = document.getElementById("portInput").value;
    const password = document.getElementById("passwordInput").value;

    // can't use an if statement but can do this. thanks js
    let passwordHash = prepend_hash ? sha256(password) : "";
    /*
     * structure:
     *
     * <12bytenonce><encrypteddata>
     *
     * where encrypteddata is the chacha20 encrypted data with the nonce and the password, the structure of it when unencrypted is the usual:
     * <sha256hash><request>:<arg1>:<arg2>...
     */

    let plainRequest = prepend_hash ? `${passwordHash}:${message}` : message;

    if(password.length > 32) {
        user_response.textContent = "Password is too long (password.length <= 32 not true)";
        icon_symbol.classList.remove("icon-checkmark");
        icon_symbol.classList.add("icon-cross");
        return;
    }

    const encodedPassword = new TextEncoder().encode(password);

    const encodedPlainRequest = new TextEncoder().encode(plainRequest); // Encode the text as a byte array

    // Secure key initialization
    let key = new Uint8Array(32);
    key.set(encodedPassword); // all indices after will be null
    const nonce = new Uint8Array(12);
    crypto.getRandomValues(nonce);

    let requestSize = plainRequest.length;

    let nonceSize = nonce.length;

    const encryptedRequest = new JSChaCha20(key, nonce).encrypt(encodedPlainRequest);

    // Create the final byte array: concatenate nonce and encrypted data
    const finalRequest = new Uint8Array(nonceSize + requestSize);
    finalRequest.set(nonce); // Copy nonce into the beginning of finalRequest
    finalRequest.set(encryptedRequest, nonceSize); // Copy encryptedData after the nonce


    console.log(`Sending request ${plainRequest} to ${ip}:${port}`);

    const url = `http://${ip}:${port}/`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: finalRequest,
        });

        const resp = await response.bytes();
        console.log(`got response ${resp}`);
        if (resp.length < 4) {
            user_response.textContent = `Invalid response! Raw bytes: ${resp}`;
            return;
        }
        let status_code = parseStatusCode(resp);
        if (resp.length == 4) {
            user_response.textContent = `Received status: ${status_code}`;
            return;
        }
        let nonce = resp.slice(4, 16);
        let bytes = resp.slice(16);
        console.log(nonce);
        console.log(bytes);
        // mom, can we have shadowing?
        // we have shadowing at home
        // shadowing at home:
        console.log(key, nonce, bytes);
        let decryptedResponse = new JSChaCha20(key, nonce).decrypt(bytes);
        console.log(decryptedResponse);
        decryptedResponse = Array.from(decryptedResponse, byte => String.fromCharCode(byte));
        decryptedResponse = decryptedResponse.join('');
        console.log(`decrypted Response: ${decryptedResponse}`);
        // its either [statuscode] or [statuscode][nonce][encrypted_data]
        user_response.textContent = `${status_code} response: ${decryptedResponse}`;
    } catch (e) {
        console.error(`failed to send network request: ${e}`);
        user_response.textContent = e;
        icon_symbol.classList.remove("icon-checkmark");
        icon_symbol.classList.add("icon-cross");
    }
}

function parseStatusCode(input) {
    let sliced = input.slice(0, 4);
    // convert from [u8;4] to string
    // (sorry for rust array lingo lmao. hallilo's never gonna understand what [u8;4] is)
    let firstFour = Array.from(sliced, byte => String.fromCharCode(byte));
    firstFour = firstFour.join('');
    console.log(`first 4 letters: ${firstFour}, parseInt'd: ${parseInt(firstFour)}`);
    // hardcoded: set checkmark if STATUS_SUCCESS
    if (firstFour == 0 || firstFour == 50) {

        console.log("firsfour trig");
        icon_symbol.classList.remove("icon-cross");
        icon_symbol.classList.add("icon-checkmark");
    } else {
        icon_symbol.classList.add("icon-cross");
        icon_symbol.classList.remove("icon-checkmark");
    }
    let friendly_status_code = STATUS_CODES[firstFour] || "Unknown Status";
    return `${friendly_status_code} (${firstFour})`
}
