import {
  createSpinner,
  createSpinnerAsElement,
  removeSpinner,
  setSpinnerSize,
} from "./javascriptFunctions/spinner.js";

function getFormattedMonth(month) {
  // Convert month to a string and add a leading zero to single-digit months
  const monthString = month.toString();
  if (monthString.length === 1) {
    return `0${month}`;
  } else {
    return month;
  }
}

let openAIKey = "";

const fetchColors = async () => {
  try {
    const response = await fetch(
      "https://ti4hjowhkzaotsph53dyyv6luq0rqsvb.lambda-url.eu-west-2.on.aws/"
    );
    return response.json();
  } catch (error) {
    console.error("Error fetching the color data:", error);
  }
};

let calendarColors = fetchColors();

const generateRandomColors = () => {
  if (!calendarColors) {
    console.warn("Colors not loaded yet");
    // Return a default color pair or handle this case as appropriate
    return { text: "#000000", background: "#FFFFFF" };
  }
  const colorNames = Object.keys(calendarColors);
  const randomColorName =
    colorNames[Math.floor(Math.random() * colorNames.length)];
  return calendarColors[randomColorName];
};

async function fetchOpenAIKey() {
  try {
    const response = await fetch(
      `https://oh3uau67qoyk7juqhwo75ivyta0hhhcy.lambda-url.eu-west-2.on.aws/`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      const responseData = await response.json();
      console.log("Received OpenAI API key:", responseData);
      openAIKey = responseData.key;
    }
  } catch (error) {
    console.error("Error fetching key:", error);
  }
}

fetchOpenAIKey();

const clearEventsScreen = function () {
  const events = document.querySelectorAll(".event");
  events.forEach((event) => {
    eventContainer.removeChild(event);
  });

  const noEventsElement = document.querySelector(".no-events");
  if (noEventsElement) {
    eventContainer.removeChild(noEventsElement);
  }
};

let eventsList = [];

async function fetchEvents(year, month) {
  const formattedMonth = getFormattedMonth(month);
  try {
    const response = await fetch(
      `https://kaosevxmrvkc2qvjjonfwae4z40bylve.lambda-url.eu-west-2.on.aws/calendarManager?year=${year}&month=${formattedMonth}`
    );

    const data = await response.json();

    // Handle the case where no events are found or handle the list of event file names
    if (data.events.length === 0) {
      console.log("No events found for this month");
      // Handle no events found
      clearEventsScreen();
      createEventDivs(eventsList, false);
    } else {
      // Assuming 'data' is an array of events
      eventsList = data; // Update the UI with these events
      console.log(eventsList.events);
      // Update your UI here with the eventsList
      clearEventsScreen();
      createEventDivs(eventsList);
    }
    removeSpinner();
  } catch (error) {
    console.error("Error:", error);
    // Handle errors, possibly with retry logic or user notification
  }
}

const eventContainer = document.querySelector(".events-container");

const createEventDivs = function (eventsList, eventsFound = true) {
  if (!eventsFound) {
    const noEventsFound = document.createElement("div");
    noEventsFound.classList.add("no-events");
    noEventsFound.textContent = "No events found for this month";
    eventContainer.appendChild(noEventsFound);
    return;
  }
  let count = 0;
  for (let i = 0; i < eventsList.events.length; i++) {
    const eventName = eventsList.events[i]["name"];
    const eventElement = document.createElement("div");
    eventElement.classList.add("event");

    // Add delete icon element
    const deleteIcon = document.createElement("span");
    deleteIcon.classList.add("delete-icon");
    // add a class of "delete-eventID" to the icon
    deleteIcon.classList.add(`delete-${eventsList.events[i]["eventID"]}`);
    deleteIcon.innerHTML = "🗑️"; // Unicode for trash can
    deleteIcon.onclick = function () {
      createSpinner(`.delete-${eventsList.events[i]["eventID"]}`, 18, "right");
      deleteEvent(eventsList.events[i]["eventID"]); // Call the delete function when icon is clicked
      fetchEvents(selectedYear, selectedMonth);
    };

    eventElement.innerHTML = `
            <div class="individual_event event__title">${eventName}</div>
            <div class="individual_event_dates">
              <div class="individual_event event__date">${eventsList.events[i]["startDate"]}</div>
              <div class="individual_event date_divider">---</div>
              <div class="individual_event event__date">${eventsList.events[i]["endDate"]}</div>
            </div>
            <div class="individual_event_times">
              <div class="individual_event style_small event__start">${eventsList.events[i]["startTime"]}</div>
              <div class="individual_event time_divider">---</div>
              <div class="individual_event style_small event__end">${eventsList.events[i]["endTime"]}</div>
            </div>
            <div class="individual_event event__location">${eventsList.events[i]["location"]}</div>
            <div class="individual_event event__id">${eventsList.events[i]["eventID"]}</div>
            <div class="individual_event event__user">User: ${eventsList.events[i]["user"]}</div>

        `;
    eventElement.appendChild(deleteIcon);
    eventContainer.appendChild(eventElement);
    count++;
  }
};

const newEventWithoutRefresh = function (eventData) {
  const eventName = eventData["name"];
  const eventElement = document.createElement("div");
  eventElement.classList.add("event");

  // Add delete icon element
  const deleteIcon = document.createElement("span");
  deleteIcon.classList.add("delete-icon");
  // add a class of "delete-eventID" to the icon
  // deleteIcon.classList.add(`delete-${eventData.eventID}`);
  deleteIcon.innerHTML = "🗑️"; // Unicode for trash can
  deleteIcon.onclick = function () {
    // createSpinner(`.delete-${eventData["eventID"]}`, 18, "right");
    deleteEvent(eventData["eventID"]); // Call the delete function when icon is clicked
    fetchEvents(selectedYear, selectedMonth);
  };

  eventElement.innerHTML = `
            <div class="individual_event event__title">${eventName}</div>
            <div class="individual_event_dates">
              <div class="individual_event event__date">${eventData.startDate}</div>
              <div class="individual_event date_divider">---</div>
              <div class="individual_event event__date">${eventData.endDate}</div>
            </div>
            <div class="individual_event_times">
              <div class="individual_event style_small event__start">${eventData.startTime}</div>
              <div class="individual_event time_divider">---</div>
              <div class="individual_event style_small event__end">${eventData.endTime}</div>
            </div>
            <div class="individual_event event__location">${eventData.location}</div>
            <div class="individual_event event__id">EventID not generated</div>
            <div class="individual_event event__user">User: ${eventData.user}</div>

        `;
  eventElement.appendChild(deleteIcon);
  eventContainer.appendChild(eventElement);
};

// get current date
const date = new Date();
const year = date.getFullYear();
const month = date.getMonth() + 1;
const day = date.getDate();

const joinedDate = `${day}/${month}/${year}`;

fetchEvents(year, getFormattedMonth(month));

const dateElement = document.querySelector(".date");
dateElement.textContent = `${getFormattedMonth(month)}/${year}`;

const nextMonthArrow = document.querySelector(".next-month");
const previousMonthArrow = document.querySelector(".previous-month");

let selectedMonth = getFormattedMonth(month);
let selectedYear = year;

nextMonthArrow.addEventListener("click", function () {
  selectedMonth++;
  if (selectedMonth > 12) {
    selectedMonth = 1;
    selectedYear++;
  }
  selectedMonth = getFormattedMonth(selectedMonth);
  updateDatePicker(selectedYear, selectedMonth);
  fetchEvents(selectedYear, selectedMonth);
  clearEventsScreen();
  console.log(selectedMonth);
});

previousMonthArrow.addEventListener("click", function () {
  selectedMonth--;
  if (selectedMonth < 1) {
    selectedMonth = 12;
    selectedYear--;
  }
  selectedMonth = getFormattedMonth(selectedMonth);
  updateDatePicker(selectedYear, selectedMonth);
  fetchEvents(selectedYear, selectedMonth);
  clearEventsScreen();
  console.log(selectedMonth);
});

const updateDatePicker = function (year, month) {
  const dateElement = document.querySelector(".date");
  dateElement.textContent = `${month}/${year}`;
};

async function postEvent(eventData, year, month) {
  try {
    const response = await fetch(
      `https://kaosevxmrvkc2qvjjonfwae4z40bylve.lambda-url.eu-west-2.on.aws/calendarManager?year=${year}&month=${month}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      const responseData = await response.json();
      console.log("Event added successfully", responseData);
      // Use responseData here to get details like the new event ID or confirmation message
    }
  } catch (error) {
    console.error("Error posting event:", error);
  }
  clearEventsScreen();
  fetchEvents(selectedYear, selectedMonth);
}

// Global array to store events
const newEvents = [];

const addEventButton = document.querySelector(".add-event-btn");
addEventButton.addEventListener("click", function () {
  createSpinner(".add-event-btn", 18, "right");
  const formatDate = function (date) {
    const day = date.slice(8, 10);
    const month = date.slice(5, 7);
    const year = date.slice(0, 4);
    return `${day}/${month}/${year}`;
  };

  const nameToPost = document.querySelector(".input-title").value;
  let startDateToPost = document.querySelector(".input-start-date").value;
  console.log(startDateToPost);
  if (startDateToPost === "") {
    startDateToPost = joinedDate;
  }
  const endDateToPost = document.querySelector(".input-end-date").value;
  const extractedMonth = startDateToPost.slice(5, 7);
  const extractedYear = startDateToPost.slice(0, 4);
  let userToPost = document.querySelector(".input-user").value;

  if (userToPost === "") {
    userToPost = "Bartek";
  }

  const startTimeToPost = document.querySelector(".input-start").value;
  const endTimeToPost = document.querySelector(".input-end").value;
  const locationToPost = document.querySelector(".input-location").value;

  const eventToPost = {
    name: nameToPost,
    startDate: formatDate(startDateToPost), // Format the start date to DD/MM/YYYY
    endDate: formatDate(endDateToPost), // Format the end date to DD/MM/YYYY
    startTime: startTimeToPost,
    endTime: endTimeToPost,
    location: locationToPost,
    user: userToPost,
    color: generateRandomColors(),
  };

  newEvents.push(eventToPost);
  console.log(eventToPost);

  // console.log(extractedMonth, extractedYear);
  postEvent(eventToPost, extractedYear, extractedMonth);

  console.log(newEvents);
  fetchEvents(extractedYear, extractedMonth);
});

async function deleteEvent(eventID) {
  try {
    const response = await fetch(
      `https://kaosevxmrvkc2qvjjonfwae4z40bylve.lambda-url.eu-west-2.on.aws/calendarManager?eventID=${eventID}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    } else {
      const responseData = await response.json();
      console.log("Event deleted successfully", responseData);
      // Additional logic to update UI or state as needed
      // clear the events screen
      clearEventsScreen();
      fetchEvents(selectedYear, selectedMonth);
    }
  } catch (error) {
    console.error("Error deleting event:", error);
  }
}

const deleteEventButton = document.querySelector(".delete-event-btn");
deleteEventButton.addEventListener("click", function () {
  const eventIDToDelete = document.querySelector(".input-delete").value;
  deleteEvent(eventIDToDelete);
  fetchEvents(selectedYear, selectedMonth);
});

const OPENAI_API_KEY = "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";
const openRouterAPIkey =
  "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";
const dateForOpenAI = `${day}/${getFormattedMonth(month)}/${year}`;
console.log(dateForOpenAI);
const sendToOpenAI = function (textToParse) {
  const startTime = performance.now();
  const prompt = `Today is ${joinedDate}. You are an NLU to calendar converter. Output in JSON with the following keys: “name”, “startDate”, “endDate”, “startTime”, “endTime”, “location”.

  YOU MUST OUTPUT NOTHING BUT THE RAW JSON, NO CODEBLOCKS, NO COMMENTS OR ANYTHING ELSE.
  Instructions:
  - Extract relevant info (morning: 7:00, afternoon: 15:00, evening: 19:00, night: 23:00)
  - Use 24-hour clock
  - Assume current day if no date given
  - Date in format DD/MM/YYYY
  - Assume all-day event if no time given (startTime: "allDay", endTime: "allDay")
  - Assume 1-hour duration if no end time
  - You may repeat info in multiple keys, eg. in "location" and "name"
  - Capitalize first letters in "name" and "location"
  - For the "location", use comedic slang if not provided, like "gaff"`;

  const data = {
    model: "gpt-3.5-turbo-1106",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: textToParse,
      },
    ],
  };

  fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openAIKey}`, // Ensure this is securely handled
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      const endTime = performance.now();
      const timeTaken = endTime - startTime;
      console.warn(
        `Response received in ${timeTaken.toFixed(2)} milliseconds.`
      );
      console.log("Success:", data);
      const responseMessage = data.choices[0].message.content; // The JSON string from OpenAI
      // Convert JSON string to an object
      const eventDetails = JSON.parse(responseMessage);

      const eventData = {
        name: eventDetails.name,
        startDate: eventDetails.startDate,
        endDate: eventDetails.endDate,
        startTime: eventDetails.startTime,
        endTime: eventDetails.endTime,
        location: eventDetails.location,
        user: "Default User",
        color: generateRandomColors(),
      };
      const [day, month, year] = eventDetails.startDate.split("/");
      console.log("Event Data:");
      console.log(eventData);
      newEventWithoutRefresh(eventData);
      postEvent(eventData, year, month);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

const sendToOpenRouter = function (
  textToParse,
  model = "mistralai/mistral-small"
) {
  const startTime = performance.now();
  const systemPrompt = `Today is ${joinedDate}. You are an NLU to calendar converter. Output in JSON with the following keys: “name”, “startDate”, “endDate”, “startTime”, “endTime”, “location”.

  Instructions:

  - Extract relevant info (morning: 7:00, afternoon: 15:00, evening: 19:00, night: 23:00)
  - Use 24-hour clock
  - Assume current day if no date given
  - Date in format DD/MM/YYYY
  - Assume all-day event if no time given (startTime: "allDay", endTime: "allDay")
  - Assume 1-hour duration if no end time
  - You may repeat info in multiple keys, eg. in "location" and "name"
  - Capitalize first letters in "name" and "location"
  - For the "location", if not provided, extrapolate, with comedic modern slang`;

  const data = {
    model: model,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: textToParse,
      },
    ],
  };

  fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openRouterAPIkey}`, // Ensure this is securely handled
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      const endTime = performance.now();
      const timeTaken = endTime - startTime;
      console.warn(
        `Response received in ${timeTaken.toFixed(2)} milliseconds.`
      );

      console.log("Success:", data);
      const responseMessage = data.choices[0].message.content; // The JSON string from OpenRouter
      // Convert JSON string to an object
      const eventDetails = JSON.parse(responseMessage);

      const eventData = {
        name: eventDetails.name,
        startDate: eventDetails.startDate,
        endDate: eventDetails.endDate,
        startTime: eventDetails.startTime,
        endTime: eventDetails.endTime,
        location: eventDetails.location,
        user: "Default User",
        color: generateRandomColors(),
      };
      const [day, month, year] = eventDetails.startDate.split("/");
      postEvent(eventData, year, month);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

const naturalLanguageButton = document.querySelector(".natural-language-btn");
naturalLanguageButton.addEventListener("click", function () {
  createSpinner(".natural-language-btn", 18, "right");
  const textToParse = document.querySelector(".input-natural").value;
  sendToOpenAI(textToParse);
  document.querySelector(".input-natural").value = "";
});
