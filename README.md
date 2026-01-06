# Sport4U

Piattaforma web per la gestione di campi sportivi, prenotazioni, tornei e partite.

## Tecnologie

- **Backend**: Node.js, Express
- **Database**: MySQL 8.0
- **Autenticazione**: JWT
- **Containerizzazione**: Docker, Docker Compose

## Prerequisiti

- Docker e Docker Compose

## Installazione

1. Clona il repository
```bash
git clone <repository-url>
cd sport4u
```

2. Configura le variabili d'ambiente
```bash
cp env.example .env
```

Modifica il file `.env` con le tue configurazioni.

## Avvio

### Con Docker Compose 

```bash
docker-compose up --build
```

L'applicazione sarà disponibile su `http://localhost:3000`



## Struttura del progetto

```
sport4u/
├── client/          # Frontend (HTML, CSS, JS)
├── server/          # Backend (Express API)
├── docker-compose.yml
├── Dockerfile
└── package.json
```


## Variabili d'ambiente

Vedi `env.example` per la lista completa delle variabili d'ambiente necessarie.

## Account di test

E' possibile effettuare il login con il seguente account già esistente: 
- Username: carol
- Password: 12341234
