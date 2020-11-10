# DENO NETWORK ID

## GET STARED

 - ### PREREQUIS
     - avoir installé DENO
     - un serveur mysql
     - un client mysql
     - un terminal
    
 - ### INSTALLATION
   - #### SANS DOCKER
     1. Générer un fichier .env
       
            deno run --allow-read --allow-write ./project/cmd.ts env ENV_VAR1=ENV_VALUE1 ...
     2. Migrer la base de donnés
    
            deno run --allow-env --allow-net ./project/cmd.ts migrate
     3. Lancer le serveur
        
            deno run --allow-env --allow-net --allow-read ./project/main.ts
    
   - #### AVEC DOCKER
     - sur linux/mac

           sh docker-build.sh <comtainer-name>
     - sur windows
     
           docker-compose build
           docker-compose up <container-name>

## ANNEXES

- [DENO](https://deno.land/)
    - [mysql connector](https://deno.land/x/mysql@v2.6.0)
    - [oak backend framework](https://deno.land/x/oak@v6.3.1)
    - [webview](https://deno.land/x/webview@0.4.7)
    - [tutorials](https://denotutorials.net)
- [TypeScript Decorators](https://www.typescriptlang.org/docs/handbook/decorators.html)
