Habit Tracker App
Authors: Andrew Brown, Joshua Francis, Nour Hadhoud, Ziming (Ming) Liu, Doris Nezaj, Hugo Potier De La Morandiere, Fasih-Ur Rahman, Scarlett Smith, Ivan Tachev
Welcome to your Expo app 👋
This is an Expo project created with create-expo-app.

Get started
MacOS install (brew)

brew install mysql
brew services start mysql
mysql --version
mysql -u root -p
CREATE DATABASE habitdb;
EXIT;
cd server
npm install # Install dependencies
npm start # Start the server
cd ../client # New terminal
npm install # Install dependencies
expo/npm start # Start the React Native app
Windows install

mysql -u root -p # Sign in prompt, mysql must be installed prior
CREATE DATABASE habitdb;
cd server
npm install # If u dont have dependencies
npm start # Terminal output: Server listening on port 3000 Connected to MySQL database habitdb
Start a new terminal
cd ../client
npm install
expo/npm start
In the output, you'll find options to open the app in a

development build
Android emulator
iOS simulator
Expo Go, a limited sandbox for trying out app development with Expo
You can start developing by editing the files inside the app directory. This project uses file-based routing.

Get a fresh project
When you're ready, run:

npm run reset-project
This command will move the starter code to the app-example directory and create a blank app directory where you can start developing.

This project is supported by AI