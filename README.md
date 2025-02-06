# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

MacOS install
# Install MySQL (if not installed)
brew install mysql
brew services start mysql
mysql --version

# Create MySQL Database
mysql -u root -p
CREATE DATABASE habitdb;
EXIT;

# Set Up Backend
cd server
npm install  # Install dependencies
npm start    # Start the server

# Open a new terminal and set up the client
cd ../client
npm install  # Install dependencies
expo start   # Start the React Native app



Windows install
1.   mysql -u root -p (sign in prompt, mysql must be installed prior) 
2.   CREATE DATABASE habitdb;
3.   cd server
4.   npm install (if u dont have dependencies)
5.   npm start
      Server listening on port 3000
      Connected to MySQL database habitdb (terminal output if done correctly)
6. Start a new terminal
7. cd ../client
8. npm install
9. expo start

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
