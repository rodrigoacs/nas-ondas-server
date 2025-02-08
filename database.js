import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
})

export function dbConnect() {
  return new Promise((resolve, reject) => {
    pool.connect((err, client, release) => {
      if (err) {
        console.error('Erro ao adquirir cliente do banco:', err.stack)
        return reject(err)
      }
      console.log('Conectado ao banco de dados')
      resolve({ client, release })
    })
  })
}

export function dbClose() {
  return pool.end()
    .then(() => {
      console.log('Conexão com o banco de dados fechada')
    })
    .catch((err) => {
      console.error('Erro ao fechar a conexão com o banco de dados:', err)
    })
}

export async function query(text, params) {
  return pool.query(text, params)
}
