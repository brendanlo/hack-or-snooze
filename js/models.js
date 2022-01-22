"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    return new URL(this.url).hostname;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, storyData) {

    const storyResponse = await axios.post(`${BASE_URL}/stories`, {
      token: user.loginToken,
      story: {
        title: storyData.title,
        author: storyData.author,
        url: storyData.url
      }
    });

    console.log("storyResponse: ", storyResponse);
    const story = storyResponse.data.story;
    console.log("story: ", story);

    const newStory = new Story({
      storyId: story.storyId,
      title: story.title,
      author: story.author,
      url: story.url,
      username: story.username,
      createdAt: story.createdAt
    });

    storyList.stories.unshift(newStory);

    return newStory;
  }

  /** this will take an input of storyId and return either a story object
   * or undefined if no story with that storyId exists
   */

  static async getStory(storyId) {
    console.log("in getStory, storyId = ", storyId);
    try {
      const response = await axios.get(`${BASE_URL}/stories/${storyId}`);
      return response.data.story;
      //new Story ({...response.data})
    }
    catch (error) {
      console.error(error)
      return undefined;
    }

  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
    username,
    name,
    createdAt,
    favorites = [],
    ownStories = []
  },
    token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    const { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    const { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */

  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      const { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }

  /** takes in a Story instance, 
   * adds story to currentUser favorites array, 
   * adds story to database User {favoritesArray} 
   * */

  async addFavorite(storyId) {

    //add Story instance to database
    const response = await axios.post(
      `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      {
        token: this.loginToken
      });
    console.log("response", response);

    // finds Story instance from storyList with star's storyId 
    const favoriteStory = storyList.stories.find((story) => {
      return (story.storyId === storyId);
    });

    this.favorites.push(favoriteStory);
    // console.log("storyId = ", story.storyId);
  }

  /** removeFavorite takes in a Story instance to remove from the user's 
   * favorite list. 
   * It removes a story from the currentUser favorites array, 
   * removes the story from the database User {favoritesArray} 
   */

  async removeFavorite(storyId) {

    //delete Story instance from database
    const response = await axios.delete(
      `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      {
        data: {
          token: this.loginToken
        }
      });

    console.log("response", response);

    // returns currentUser favorites array without removeStory
    this.favorites = this.favorites.filter((s) => {
      return (s.storyId !== storyId);
    });
  }



}
