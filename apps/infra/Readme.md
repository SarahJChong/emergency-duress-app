# Input required

* Auth0 tenant
* Auth0 clientid (cli app)
* Auth0 clientsecret (cli app)
* Sendgrid api key
* web url
* api url



# Infra prep

```
chmod +x expo/docker-entrypoint.sh
chmod +x api/Api/docker-entrypoint.sh  
chmod +x infra/web-push/generate-vapid-env.sh
chmod +x /infra/auth0/update-auth0-env-values.sh
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

## Export auth0

```
docker compose -f compose-infra.yml run --rm auth0-export
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
docker compose build
docker compose up -d
```
