"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
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
  return $(`
      <li id="${story.storyId}">
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

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  // loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

/** collects the input values from the story-form, then creates a new Story, 
 * adds that story instance to the storyList array, then updates the page to 
 * include the new story. redhides the submit story form
 */

async function getStoryDataAndDisplay(evt) {
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
  storyList.stories.unshift(newStory);

  putStoriesOnPage();
  $submitStoryForm.hide();
}

$submitStoryBtn.on("click", getStoryDataAndDisplay);
