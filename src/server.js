const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');

/* eslint-disable no-unused-vars */
const bodyParser = require('body-parser');
const cors = require('cors');
/* eslint-enable no-unused-vars */
const axios = require('axios');
const utils = require('./utils');
require('dotenv').config();

// fn to create express server
const create = async () => {

    // server
    const app = express();
    app.use(favicon(path.join(__dirname, '../public', 'favicon.ico')));
    
    // Log request
    app.use(utils.appLogger);

    // root route - serve static file
    app.get('/api/hello', (req, res) => {
        res.json({hello: 'goodbye'});
        res.end();
    });

    // root route - serve static file
    app.get('/', (req, res) => {
        return res.sendFile(path.join(__dirname, '../public/client.html'));
    });

    app.get('/hi', (req, res) => {
        res.send('Hello API!');
      });

    // Linkedin API
    app.post('/linkedin-sso-response', async (req, res) => {
        try {
          console.log('%capp.js line:17 req.body', 'color: #007acc;', req.body);
          if (!req.body.redirectUri || !req.body.code) {
            return res.json({ msg: 'Some Error occured! Try again' });
          }
          const { code, redirectUri } = req.body;
          console.log('%capp.js line:18 code', 'color: #007acc;', code);
          const clientId = process.env.CLIENT_ID;
          const clientSecret = process.env.CLIENT_SECRET;
          const response = await axios.get(
            `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&code=${code}&redirect_uri=${redirectUri}`
          );
          const accessToken = response.data ? response.data.access_token : '';
          console.log('%capp.js line:24 accessToken', 'color: #007acc;', accessToken);
          const configA = {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          };
          const userData = await axios.get('https://api.linkedin.com/v2/me', configA);
          const name =
            userData.data.localizedFirstName + userData.data.localizedLastName
              ? `${userData.data.localizedFirstName 
                } ${ 
                userData.data.localizedLastName}`
              : '';
      
          const profilePicture = await axios.get(
            'https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
            configA
          );
      
          const {elements} = profilePicture.data.profilePicture['displayImage~'];
          const identifier =
            elements && elements.length > 0
              ? elements[elements.length - 1].identifiers
              : {};
          const profilePic = identifier && identifier[0] && identifier[0].identifier;
      
          const emailData = await axios.get(
            'https://api.linkedin.com/v2/clientAwareMemberHandles?q=members&projection=(elements*(name,primary,type,handle~))',
            configA
          );
      
          const emailUser =
            emailData.data && emailData.data.elements && emailData.data.elements[0]
              ? emailData.data.elements[0]['handle~'].emailAddress
              : '';
      
          if (emailUser && name) {
            console.log('%capp.js line:67 ', 'color: #007acc;', {
              accessToken,
              name,
              profilePic,
              email: emailUser,
            });
            return res.json({
              accessToken,
              name,
              profilePic,
              email: emailUser,
            });
          } 
            return res.json({ msg: 'Some Error occured! Try again' });
          
        } catch (err) {
          // console.log(err)
          return res.status(500).json(err);
        }
    });

    // Catch errors
    app.use(utils.logErrors);
    app.use(utils.clientError404Handler);
    app.use(utils.clientError500Handler);
    app.use(utils.errorHandler);

    return app;
};

module.exports = {
    create
};
