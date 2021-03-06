"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage(storyList.stories);
}

/** showStars checks if a user is logged in. If so, then it will show favorited
 * stories as a solid star and non-favorited as hollow.
 * If the user is not logged in, no stars will show up in the DOM.
 * this is a helper function for generateStoryMarkup
*/

function showStars(story) {
  if (currentUser) {
    //find out whether Story instance is also in currentUser [favorites]
    const storyInFav = currentUser.favorites.filter((favStory) => {
      return favStory.storyId === story.storyId
    });
    console.log('storyInFav= ', storyInFav);

    const favoriteStatus = (storyInFav.length === 0) ? "far" : "fas";
    console.log('story.title: ', story.title, ' favoriteStatus: ', favoriteStatus);
    return `<i class="${favoriteStatus} fa-star"></i>`;
  } else {
    return "";
  }
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {

  const hostName = story.getHostName();

  return $(`
      <li id="${story.storyId}">
        ${showStars(story)}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}
/**NOTE: starter code altered here to include parameters, added args to function calls */
/** Takes an array of Story instances, generates their HTML, and puts on page. */

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

  const newStory = await storyList.addStory(currentUser, storyFormVals);
  $allStoriesList.prepend(generateStoryMarkup(newStory));

  $submitStoryForm.trigger("reset");
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

/**
 * upon clicking hollow (unfavorited) star, 
 * finds matching Story instance from storyList,
 * add Story instance to currentUser's favorites array,
 * toggles star html
 */
async function addFavoriteStar(evt) {
  const $star = $(evt.target);
  const storyId = $star.closest("li").attr("id");

  currentUser.addFavorite(storyId);

  $star.addClass("fas");  //turns on solid star
  $star.removeClass("far") //turns off hollow star
}

/**
 * upon clicking solid (favorited) star, 
 * finds matching Story instance from storyList,
 * removes Story instance from currentUser's favorites array,
 * toggles star html
 */

async function removeFavoriteStar(evt) {
  const $star = $(evt.target);
  const storyId = $star.closest("li").attr("id");

  currentUser.removeFavorite(storyId);

  $star.addClass("far");  //turns on hollow star
  $star.removeClass("fas") //turns off solid star
}


$allStoriesList.on("click", ".far.fa-star", addFavoriteStar);
$allStoriesList.on("click", ".fas.fa-star", removeFavoriteStar);
