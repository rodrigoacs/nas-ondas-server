import express from 'express'
import bodyParser from 'body-parser'
import jwt from 'jsonwebtoken'
import { query } from './database.js'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const SECRET_KEY = process.env.SECRET_KEY
const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname)))

app.use(bodyParser.json())
app.use(cors())

app.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password são obrigatórios.' })
  }

  try {
    const user = await getUser(username)

    if (!user) {
      return res.status(400).json({ error: 'Username ou password inválidos.' })
    }

    const isPasswordValid = password === user.password

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Username ou password inválidos.' })
    }

    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' })

    return res.status(200).json({ message: 'Login efetuado com sucesso', token })
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao realizar o login do usuário.' })
  }
})

app.post('/config', async (req, res) => {
  let { youtube1, youtube2, instagram1, instagram2, instagram3, instagram4 } = req.body

  const extractYoutubeId = (url) => {
    const match = url.match(/(?:watch\?v=|youtu\.be\/)([^?&]+)/)
    return match ? match[1] : url
  }

  const extractInstagramId = (url) => {
    const match = url.match(/(?:p|reel)\/([^/?]+)/)
    return match ? match[1] : url
  }

  youtube1 = extractYoutubeId(youtube1)
  youtube2 = extractYoutubeId(youtube2)
  instagram1 = extractInstagramId(instagram1)
  instagram2 = extractInstagramId(instagram2)
  instagram3 = extractInstagramId(instagram3)
  instagram4 = extractInstagramId(instagram4)

  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Token não informado' })
  }

  const token = req.headers.authorization.split(' ')[1]

  try {
    jwt.verify(token, SECRET_KEY)
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' })
  }

  try {
    const result = await saveSettings([youtube1, youtube2, instagram1, instagram2, instagram3, instagram4])

    return res.status(200).json(result)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao salvar configurações' })
  }
})

app.get('/config', async (req, res) => {
  try {
    const result = await query('SELECT * FROM videos')

    const settings = result.rows.reduce((acc, row) => {
      acc[row.category] = row.url
      return acc
    }, {})

    return res.status(200).json(settings)
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar configurações' })
  }
})

app.listen(3031, () => {
  console.log('Servidor rodando na porta 3031')
})

async function getUser(username) {
  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username])
    console.log('result: ', result)

    return result.rows[0]
  } catch (err) {
    console.error('Erro ao consultar usuário:', err)
    throw err
  }
}

async function saveSettings([youtube1, youtube2, instagram1, instagram2, instagram3, instagram4]) {
  let updateYoutube1, updateYoutube2, updateinstagram1, updateinstagram2, updateinstagram3, updateinstagram4

  try {
    await query('BEGIN')

    if (youtube1) {
      updateYoutube1 = await query(
        'UPDATE videos SET url = $1 WHERE category = $2;',
        [youtube1, 'youtube1']
      )
    } else {
      updateYoutube1 = { rowCount: 0 }
    }

    if (youtube2) {
      updateYoutube2 = await query(
        'UPDATE videos SET url = $1 WHERE category = $2;',
        [youtube2, 'youtube2']
      )
    } else {
      updateYoutube2 = { rowCount: 0 }
    }

    if (instagram1) {
      updateinstagram1 = await query(
        'UPDATE videos SET url = $1 WHERE category = $2;',
        [instagram1, 'instagram1']
      )
    } else {
      updateinstagram1 = { rowCount: 0 }
    }

    if (instagram2) {
      updateinstagram2 = await query(
        'UPDATE videos SET url = $1 WHERE category = $2;',
        [instagram2, 'instagram2']
      )
    } else {
      updateinstagram2 = { rowCount: 0 }
    }

    if (instagram3) {
      updateinstagram3 = await query(
        'UPDATE videos SET url = $1 WHERE category = $2;',
        [instagram3, 'instagram3']
      )
    } else {
      updateinstagram3 = { rowCount: 0 }
    }

    if (instagram4) {
      updateinstagram4 = await query(
        'UPDATE videos SET url = $1 WHERE category = $2;',
        [instagram4, 'instagram4']
      )
    } else {
      updateinstagram4 = { rowCount: 0 }
    }

    await query('COMMIT')

    console.log('Configurações salvas com sucesso')

    return {
      youtube1: updateYoutube1.rowCount,
      youtube2: updateYoutube2.rowCount,
      instagram1: updateinstagram1.rowCount,
      instagram2: updateinstagram2.rowCount,
      instagram3: updateinstagram3.rowCount,
      instagram4: updateinstagram4.rowCount,
    }
  } catch (err) {
    await query('ROLLBACK')
    console.error('Erro ao salvar configurações:', err)
    throw err
  }
}

