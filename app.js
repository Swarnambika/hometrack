const http = require('http');

const
    ERR_PARSE_FAIL = 'Could not decode request: JSON parsing failed',
    ERR_NO_HANDLER = 'Could not handle this request. USAGE: POST application/json to /filter end-point.',
    ERR_REQ_READ = 'Error reading JSON data.';

const
    HTTP_CODE_BAD_REQUEST = 400,
    HTTP_CODE_OK = 200;


const server = http.createServer((req, res) => {

    const { method, url, body, headers } = req;
    console.log('REQ: ', method, url, headers['content-type']);

    if (method == 'POST' && url == '/filter'
        && headers['content-type'] == 'application/json') {

        let body = [];
        req.on('error', err => {
            console.log('ERR: ', err);
            respondOut(res, JSON.stringify(errorObject(ERR_REQ_READ)), HTTP_CODE_BAD_REQUEST);
        }).on('data', data => {
            body.push(data);
        }).on('end', () => {
            body = Buffer.concat(body).toString();

            let payloads = [];
            try {
                payloads = JSON.parse(body)["payload"];
            }
            catch (err) {
                console.log('ERR: ', err);
                respondOut(res, JSON.stringify(errorObject(ERR_PARSE_FAIL)), HTTP_CODE_BAD_REQUEST);
                return;
            }
            const response = payloads
                .filter(pl => pl.type == 'htv' && pl.workflow == 'completed')
                .reduce((prev, pl) => {
                    let concataddress = Object
                        .keys(pl.address)
                        .map(key => pl.address[key])
                        .join(' ');

                    prev.push({ 'concataddress': concataddress, 'type': 'htv', 'completed': 'completed' });
                    return prev;
                }, []);

            respondOut(res, JSON.stringify({ 'response': response }), HTTP_CODE_OK);
        });
    }
    else {
        respondOut(res, JSON.stringify(errorObject(ERR_NO_HANDLER)), HTTP_CODE_BAD_REQUEST);
    }

});

function respondOut(res, msg, statusCode) {
    res.statusCode = statusCode;
    res.write(msg);
    res.end()
}

function errorObject(err) {
    return { 'error': err };
}


const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});