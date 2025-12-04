const mysql = require('mysql2');
const { Client } = require('ssh2');
const dotenv = require('dotenv');

dotenv.config();

const sshClient = new Client();

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

const sshConfig = {
  host: process.env.SSH_HOST,
  port: 22,
  username: process.env.SSH_USER,
  password: process.env.SSH_PASSWORD
};

let dbConnection = null;

const connectToDatabase = () => {
  return new Promise((resolve, reject) => {
    if (dbConnection) {
      return resolve(dbConnection);
    }

    sshClient.on('ready', () => {
      console.log('SSH Connection Established');
      
      sshClient.forwardOut(
        '127.0.0.1', // source address (irrelevant for us usually)
        0,           // source port
        dbConfig.host, // destination address (internal to the SSH server network)
        dbConfig.port, // destination port
        (err, stream) => {
          if (err) {
            console.error('SSH Forwarding Error:', err);
            return reject(err);
          }

          // Create a connection using the stream
          const connection = mysql.createConnection({
            ...dbConfig,
            stream: stream
          });

          connection.connect((dbErr) => {
            if (dbErr) {
              console.error('Database Connection Error:', dbErr);
              return reject(dbErr);
            }
            console.log('MySQL Database Connected via SSH Tunnel');
            dbConnection = connection;
            resolve(connection);
          });

          connection.on('error', (err) => {
             console.error('Database error', err);
             if(err.code === 'PROTOCOL_CONNECTION_LOST') {
                 dbConnection = null;
                 // Optional: Reconnect logic could go here
             }
          });
        }
      );
    }).on('error', (err) => {
        console.error('SSH Client Error:', err);
        reject(err);
    }).connect(sshConfig);
  });
};

// Helper to execute queries with promises
const query = async (sql, params) => {
  const conn = await connectToDatabase();
  return new Promise((resolve, reject) => {
    conn.query(sql, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Helper for transactions
const getTransactionConnection = async () => {
    const conn = await connectToDatabase();
    return conn; // Return the raw connection for transaction management
};

module.exports = { query, getTransactionConnection };
