"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage(storyList.stories);
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  const storyInFav = currentUser.favorites.find(favStory => {
    favStory.storyId === story.storyId
  });
  console.log('storyInFav= ', storyInFav);

  const favoriteStatus = (storyInFav) ? "fas" : "far";
  console.log('story.title: ', story.title, ' favoriteStatus: ', favoriteStatus);

  return $(`
      <li id="${story.storyId}">
        <i class="${favoriteStatus} fa-star"></i>
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage(stories) {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** collects the input values from the story-form, then creates a new Story, 
 * adds that story instance to the storyList array, then updates the page to 
 * include the new story. redhides the submit story form
 */

async function createStoryAndDisplay(evt) {
  evt.preventDefault();

  const storyFormVals = {
    title: $("#story-title").val(),
    author: $("#story-author").val(),
    url: $("#story-url").val()
  };

  // NOTE we are working on URL form validation if time
  // let link = new URL(storyFormVals.url);
  // storyFormVals.url = (link.protocol) ? storyFormVals.url : `http://${storyFormVals.url}`;

  const newStory = await storyList.addStory(currentUser, storyFormVals);
  $allStoriesList.prepend(generateStoryMarkup(newStory));

  $submitStoryForm.hide();
}

$submitStoryBtn.on("click", createStoryAndDisplay);



/** Gets list of favorite stories from the current user instance,
 *  generates their HTML, and puts on page. */

function putFavoritesOnPage() {
  console.debug("putFavoritesOnPage");
  putStoriesOnPage(currentUser.favorites);
}

$navFavorites.on("click", putFavoritesOnPage);

async function addFavoriteStar(evt) {
  const $star = $(evt.target);
  const storyId = $star.closest("li").attr("id");

  const favoriteStoryArr = storyList.stories.filter((story) => {
    return (story.storyId === storyId);
  });

  console.log("favoriteStory: ", favoriteStoryArr);

  await currentUser.addFavorite(favoriteStoryArr[0]);

  $star.addClass("fas");  //turns on solid star
  $star.removeClass("far") //turns off hollow star
}

async function removeFavoriteStar(evt) {
  const $star = $(evt.target);
  const storyId = $star.closest("li").attr("id");

  const unfavoriteStoryArr = storyList.stories.filter((story) => {
    return (story.storyId === storyId);
  });

  console.log("favoriteStory: ", unfavoriteStoryArr);

  await currentUser.removeFavorite(unfavoriteStoryArr[0]);

  $star.addClass("far");  //turns on hollow star
  $star.removeClass("fas") //turns off solid star
}


$allStoriesList.on("click", ".far.fa-star", addFavoriteStar);
$allStoriesList.on("click", ".fas.fa-star", removeFavoriteStar);
