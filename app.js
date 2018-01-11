const http = require('http');

const
    ERR_PARSE_FAIL = 'Could not decode request: JSON parsing failed',
    ERR_NO_HANDLER = 'Could not handle this request. USAGE: POST application/json to / (root) end-point.',
    ERR_REQ_READ = 'Error reading JSON data.';

const
    HTTP_CODE_BAD_REQUEST = 400,
    HTTP_CODE_OK = 200;

// register a request handler on the newly created server
const server = http.createServer((req, res) => {

    // ES6 way of reading properties from request object
    const { method, url, body, headers } = req;
    console.log('REQ: ', method, url, headers['content-type']);

    // handle only requests post to the root with specific content-type
    if (method == 'POST' && url == '/'
        && headers['content-type'] == 'application/json') {

        // read incoming JSON block by block
        let body = [];
        req.on('error', err => {
            console.log('ERR: ', err);
            respondOut(res, JSON.stringify(errorObject(ERR_REQ_READ)), HTTP_CODE_BAD_REQUEST);
        }).on('data', data => {
            body.push(data);
        }).on('end', () => {
            body = Buffer.concat(body).toString();

            // check if JSON is parsed correctly
            let payloads = [];
            try {
                payloads = JSON.parse(body)["payload"];
            }
            catch (err) {
                console.log('ERR: ', err);
                respondOut(res, JSON.stringify(errorObject(ERR_PARSE_FAIL)), HTTP_CODE_BAD_REQUEST);
                return;
            }

            // 1. filter payloads by given criteria
            // 2. reduce them to an array of objects with only 3 properties
            const response = payloads
                .filter(pl => pl.type == 'htv' && pl.workflow == 'completed')
                .reduce((prev, pl) => {
                    let concataddress = Object
                        .keys(pl.address)
                        .map(key => pl.address[key])
                        .join(' ');

                    prev.push({ 'concataddress': concataddress, 'type': 'htv', 'workflow': 'completed' });
                    return prev;
                }, []);

            respondOut(res, JSON.stringify({ 'response': response }), HTTP_CODE_OK);
        });
    }
    else {
        respondOut(res, JSON.stringify(errorObject(ERR_NO_HANDLER)), HTTP_CODE_BAD_REQUEST);
    }

});

// utility function - sending out the response to client with appropriate status code
function respondOut(res, msg, statusCode) {
    res.statusCode = statusCode;
    res.write(msg);
    res.end()
}

function errorObject(err) {
    return { 'error': err };
}


// server listening on configured port for incoming requests
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});