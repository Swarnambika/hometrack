const http = require('http');


const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((req, res) => {

    const { method, url, body, headers } = req;
    console.log(method, url, body, headers['content-type']);

    if (method == 'POST' && url == '/filter'
        && headers['content-type'] == 'application/json') {

        let body = [];
        req.on('error', err => {
            res.write(err);

            res.statusCode = 400;
            res.end();
        }).on('data', data => {
            body.push(data);
        }).on('end', () => {
            body = Buffer.concat(body).toString();
            
            const payloads = JSON.parse(body)["payload"];
            const response = payloads
            .filter(pl => pl.type == 'htv' && pl.workflow == 'completed')
            .reduce((prev, pl) => {
                let concataddress = Object.keys(pl.address).map(key => pl.address[key]).join(' ');

                prev.push({'concataddress': concataddress, 'type': 'htv', 'completed': 'completed'});
                return prev;
            }, []);

            res.write(JSON.stringify({'response': response}));
            res.statusCode = 200;
            res.end();
        });
    }
    else {
        res.statusCode = 400;
        res.end();
    }

});


server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});