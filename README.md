## Office Site Setup
### Dashboard Website Temporary Deployment
On the machine that will host the web server, clone the Git repository.
```git clone https://github.com/RossP-13/office-site.git```
Navigate to the frontend folder in the terminal and run dev
```
cd C:\Apps\office-site\frontend
npm install
npm run dev
```
This will provide quick access to the website for the first time, but will not run optimally and will require the terminal to be open.

## Dashboard Website Database Deployment
Install Visual Studio 2019 x64 Redistributable.

This site runs off of  a MySQL server hosted on your device. To setup MySQL, please download the MySQL Community Edition version 8.0.45 at this url: https://dev.mysql.com/downloads/mysql/8.0.html 
From the MySQL bin folder:
```
mysqld.exe --initialize --console
mysqld.exe --install MySQL80
Net start MySQL80
```
Once you have the project files from GitHub, navigate to the office/main/databaseFiles folder to find the startup SQL scripts for the MySQL Database.
After accessing these files, launch the MySQL command line client in order to run these scripts and populate the initial database tables.
```
.\ C:/Apps/office-site/databaseFiles/dbStruct.sql
```
After these initial tables are populated, you will create or edit a file within your office\main\frontend folder that will be labeled ‘.env.local’ which you will fill with the premade credentials for accessing the database through the site. 
scripts and populate the initial database tables.
```
SQL_HOST=127.0.0.1
SQL_USER=gtlUser
SQL_PASSWORD=starting22GLT
SQL_DATABASE=capstoneGroup1DB
```

Afterwards if you wish, you can create a new, stronger MySQL password using the below command in the MySQL Command Line Interface, and set the .env.local file to match this new password.
Afterwards if you wish, you can create a new, stronger MySQL password using the below  command in the MySQL CLI.
```ALTER USER 'username'@'localhost' IDENTIFIED BY 'new_password';```
Afterwards if you wish, you can create a new, stronger MySQL password using the below 
### Dashboard Website Permanent Deployment
Install PowerToys from the Microsoft Store to use WinGet.
Install Git and NSSM, then restart your terminal.
```
winget install Git.Git
winget install nssm
```
Create an Apps folder directly under C: or D: so that it is not restricted to your account
```mkdir -p C:\Apps; cd C:\Apps```
On the machine that will host the web server, clone the Git repository.
```git clone https://github.com/RossP-13/office-site.git```
Install Caddy from https://caddyserver.com/download and place it in C:\Apps\office-site\caddy
To access the website from another computer, adjust the caddyfile accordingly:
```
laptopname.local { #change this to match hostname + .local
    tls internal
    reverse_proxy 127.0.0.1:3000
}
```
Install the Node.js .msi from https://nodejs.org/en/download

Continue with default settings in the installer

Check that Node.js and npm run properly in the terminal
```
node -v
npm -v
```
If npm -v results in UnauthorizedAccess, run:
```Set-ExecutionPolicy -Scope CurrentUser RemoteSigned```
Navigate to the frontend folder in the terminal and create the build.
```
cd C:\Apps\office-site\frontend
npm install
npm run build
```
Install the Node build and Caddy as services. (This may need to be run from an administrative PowerShell session)
```
nssm install OfficeSiteNode "node" "C:\Apps\office-site\frontend\build\index.js"
nssm install OfficeSiteCaddy "C:\Apps\office-site\caddy\caddy.exe" "run --config C:\Apps\office-site\caddy\Caddyfile"
```
Optionally: Create logs for the website by creating C:\Apps\office-site\logs with the files ‘std-err.log’ & ‘std-out.log’
```nssm edit OfficeSiteNode```
Navigate to I/O and select these files as output and error. Click ‘Edit Service’ to save the changes.

Start the services.
```
nssm start OfficeSiteNode
nssm start OfficeSiteCaddy
```
You should now be able to navigate to https://dashboard.localhost/ or https://laptopname.local/
If you are presented with a safety warning, run this command to permanently trust the site:
```C:\Apps\office-site\caddy\caddy.exe trust```

