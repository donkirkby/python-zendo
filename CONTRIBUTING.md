## Development

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

The data is stored in a Firebase realtime database.

* `games/$gameId` is a parent folder for all the details about a single game.
  It is readable by all users with an entry under `players`.
  * `players/$userId` records which users are playing. Anyone can write a
    record here if the list is empty, and they're making themselves the owner.
    * `name` the player's name, as entered by them and copied from `pending`.
    * `role` either 'owner' or 'player'.
    * `isWriter` true if this player is writing the current rule. Not
      implemented yet, so the owner is always the writer.
  * `pending/$userId` records users that want to join the game. You can only
    write your own id. The key's value is the player name.
  * `inputs/$inputId` records inputs for the rule writer to process. You can
    write a new record, if the author matches your user id.
    * `text` the input text, a single line.
    * `author` the user id of the player who submitted it
    * `isRuleFollowed` true, if the rule writer found that it followed the
      secret rule.
    * `areGuessesFollowed/$userId` true, if the rule guesser found that it
      followed their rule guess. Writeable by the guesser. `$userId` is who
      wrote the guess.
  * `profile` details of the game that are visible to all players, not
    implemented yet. Maybe start and end times? Source code, once revealed?
  * `guesses/$userId` holds the source code for each player's guess. Writeable
    if you use your own user id, readable by all players in this game.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
