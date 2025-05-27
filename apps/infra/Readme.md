# Input required

- Auth0 tenant
- Auth0 clientid (cli app)
- Auth0 clientsecret (cli app)
- Sendgrid api key
- web url
- api url

# External Dependencies

## Auth0

### Configure Deploy CLI

- Sign up for auth0 account
- Go to applications, click on create application
  ![](assets/auth0-createapp-1.png)
- Choose Machine to machine and click Create
  ![](assets/auth0-createapp-2.png)
- Choose Auth0 Management API and click Authorize
  ![](assets/auth0-createapp-3.png)
- Go to settings and take note of these values - client id - secret - domain
  ![](assets/auth0-createapp-4.png)
- Run

```
cp apps/.env.example apps/.env
```

- Enter to apps/.env

| .env                | Auth0     |
| ------------------- | --------- |
| AUTH0_CLIENT_ID     | Client ID |
| AUTH0_CLIENT_SECRET | Secret    |
| AUTH0_DOMAIN        | Domain    |

### Configure Users

- Go to User Management --> Users
  ![](assets/auth0-usermanagement-1.png)
  ![](assets/auth0-usermanagement-2.png)
  ![](assets/auth0-usermanagement-3.png)
  ![](assets/auth0-usermanagement-4.png)

## Sendgrid

Refer to Sendgrid setup [Link]

# Infra prep

```
cd apps
chmod +x expo/docker-entrypoint.sh
chmod +x api/Api/docker-entrypoint.sh
chmod +x infra/web-push/generate-vapid-env.sh
chmod +x infra/auth0/update-auth0-env-values.sh
chmod 777 ./api/Api/appsettings.Development.json
chmod 777 .env
```

## Build the util containers

```
docker compose -f compose-infra.yml  build
```

## Web Push

The following command will generate web push public and private key and update .env file

```
docker compose -f compose-infra.yml run --rm webpush
```

## Import auth0

```
docker compose -f compose-infra.yml run --rm auth0-import
```

## Update auth0 env values

```
docker compose -f compose-infra.yml run --rm auth0-update-env-values
```

# Starting docker containers

```
cp ./expo/.env.example ./expo/.env
docker compose build
docker compose up -d
```

# Other operations

## Export auth0

```
docker compose -f compose-infra.yml run --rm auth0-export
```
