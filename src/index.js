const server = require('./server');

const port = process.env.PORT || 7220;

server.create()
    .then(app => {
        app.listen(port, () => {
            console.log(`Server has started on port ${port}!`);
        });
    }).catch(err => console.log(err));