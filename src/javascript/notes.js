import {
  createSpinner,
  createSpinnerAsElement,
  setSpinnerSize,
} from "../assets/functions/spinner.js";

let currentUser_id = null;

function initializeUserFromLocalStorage() {
  const tokenString = localStorage.getItem(
    "sb-zbudweocjxngitnjautt-auth-token"
  );
  if (tokenString) {
    const tokenObj = JSON.parse(tokenString);
    currentUser_id = tokenObj.user.id; // Set the global variable with user details
  } else {
    console.log("No authentication token found in localStorage.");
  }
}

const pinnedNotesContainer = document.getElementById("pinned-notes-container");
const regularNotesContainer = document.getElementById(
  "regular-notes-container"
);

const addNoteButton = document.querySelector(".add-note-button");
const addNoteModal = document.querySelector(".modal-new-note");
const closeModalIcon = document.querySelector(".close-new-note-modal-icon");
const newNoteTextarea = document.getElementById("new-note-textarea");
const priorityNoteCheckbox = document.getElementById("priorityNoteCheckbox");
const newNoteSubmitBtn = document.querySelector(".new-note-submit-btn");

addNoteButton.addEventListener("click", function () {
  addNoteModal.showModal();
});

closeModalIcon.addEventListener("click", function () {
  addNoteModal.close();
});

newNoteSubmitBtn.addEventListener("click", function () {
  const noteText = newNoteTextarea.value.trim();
  const isPinned = priorityNoteCheckbox.checked ? 1 : 0;

  if (noteText === "") {
    createErrorIcon(".new-note-submit-btn", "Note cannot be empty", true);
    return;
  }

  const noteData = {
    note_text: noteText,
    creation_date: new Date().toLocaleDateString("en-GB"),
    is_pinned: isPinned,
    user_id: currentUser_id,
    group_id: localStorage.getItem("group_id"),
  };

  fetch(
    `https://eopcsfkmlwkil4fzaqz6u4nqam0unwxc.lambda-url.eu-west-2.on.aws/?group_id=${localStorage.getItem(
      "group_id"
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(noteData),
    }
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      fetchNotes().then((noteData) => parseNoteData(noteData));
      newNoteTextarea.value = "";
      priorityNoteCheckbox.checked = false;
      addNoteModal.close();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
});

async function fetchNotes() {
  pinnedNotesContainer.innerHTML = "";
  regularNotesContainer.innerHTML = "";

  try {
    const response = await fetch(
      `https://eopcsfkmlwkil4fzaqz6u4nqam0unwxc.lambda-url.eu-west-2.on.aws/?group_id=${localStorage.getItem(
        "group_id"
      )}`
    );
    const data = await response.json();
    if (data.notes.length === 0) {
      removeSpinner();
      console.log("No notes found");
      pinnedNotesContainer.innerHTML = `<p class="no-notes-message">No notes found</p>`;
      regularNotesContainer.innerHTML = `<p class="no-notes-message">No notes found</p>`;
      return;
    } else {
      return data.notes;
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

document
  .getElementById("group-selector")
  .addEventListener("change", async function () {
    const noteData = await fetchNotes();
    parseNoteData(noteData);
  });

async function refreshButtonAnimation() {
  const refreshIcon = document.querySelector(".refresh-note-button-icon");
  refreshIcon.style.transition =
    "transform 1.2s cubic-bezier(.17,1.08,.68,.98)";
  refreshIcon.style.transform = "rotate(360deg)";
  setTimeout(() => {
    refreshIcon.style.transition = "none";
    refreshIcon.style.transform = "rotate(0deg)";
  }, 1200);
}

document
  .querySelector(".refresh-note-button")
  .addEventListener("click", async function () {
    const noteData = await fetchNotes();
    parseNoteData(noteData);

    refreshButtonAnimation();
  });

function deleteNote(noteId) {
  console.log("Delete note function called with note ID: ", noteId);
  fetch(
    `https://eopcsfkmlwkil4fzaqz6u4nqam0unwxc.lambda-url.eu-west-2.on.aws/?noteId=${noteId}&group_id=${localStorage.getItem(
      "group_id"
    )}`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("Delete successful:", data);
      fetchNotes();
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

document.addEventListener("DOMContentLoaded", async function () {
  initializeUserFromLocalStorage();
});

function parseNoteData(noteData) {
  if (!noteData) {
    return;
  }

  noteData.forEach((note) => {
    const noteElement = createNoteElement(note);

    if (note.is_pinned === 1) {
      pinnedNotesContainer.appendChild(noteElement);
    } else {
      regularNotesContainer.appendChild(noteElement);
    }
  });
}

function createNoteElement(note) {
  const noteElement = document.createElement("div");
  noteElement.classList.add("note");

  const noteText = createNoteTextElement(note);
  noteElement.appendChild(noteText);

  const iconContainer = createIconContainer();
  const deleteIcon = createDeleteIcon(note);
  const editIcon = createEditIcon(note);
  const infoIcon = createInfoIcon(note);

  if (note.user_id === currentUser_id) {
    iconContainer.appendChild(deleteIcon);
    iconContainer.appendChild(editIcon);
  }

  iconContainer.appendChild(infoIcon);

  noteElement.appendChild(iconContainer);

  return noteElement;
}

function createInfoIcon(note) {
  const infoIconContainer = document.createElement("div");
  infoIconContainer.classList.add("info-icon-container");

  const infoIcon = document.createElement("i");
  infoIcon.className = "fa-solid fa-info";
  infoIcon.style.opacity = "0.55";

  const tooltipContainer = document.createElement("div");
  tooltipContainer.classList.add("tooltip-container");
  tooltipContainer.style.display = "none";
  tooltipContainer.style.position = "absolute";
  tooltipContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  tooltipContainer.style.color = "white";
  tooltipContainer.style.padding = "8px";
  tooltipContainer.style.borderRadius = "4px";
  tooltipContainer.style.marginTop = "1rem";
  tooltipContainer.style.zIndex = "1";

  const creationDateTime = document.createElement("span");
  creationDateTime.textContent = `Created on: ${note.creation_date} at ${note.creation_time}`;
  tooltipContainer.appendChild(creationDateTime);

  const br = document.createElement("br");
  tooltipContainer.appendChild(br);

  if (note.updated_date) {
    const updatedDateTime = document.createElement("span");
    updatedDateTime.textContent = `Updated on: ${note.updated_date} at ${note.updated_time}`;
    tooltipContainer.appendChild(updatedDateTime);
  }

  infoIcon.addEventListener("mouseenter", () => {
    tooltipContainer.style.display = "block";
  });

  infoIcon.addEventListener("mouseleave", () => {
    tooltipContainer.style.display = "none";
  });

  infoIconContainer.appendChild(infoIcon);
  infoIconContainer.appendChild(tooltipContainer);

  return infoIconContainer;
}

function createNoteTextElement(note) {
  const noteText = document.createElement("div");
  noteText.classList.add(note.note_id, "note-text");
  noteText.innerHTML = marked.parse(note.note_text);
  return noteText;
}

function createCreationDateTimeElement(note) {
  const creationDateTime = document.createElement("span");
  creationDateTime.classList.add("creation-date-time");
  creationDateTime.textContent = `Created on: ${note.creation_date} at ${note.creation_time}`;
  return creationDateTime;
}

function createUpdatedDateTimeElement(note) {
  const updatedDateTime = document.createElement("span");
  updatedDateTime.classList.add("updated-date-time");
  updatedDateTime.textContent = `Updated on: ${note.updated_date} at ${note.updated_time}`;
  return updatedDateTime;
}

function createIconContainer() {
  const iconContainer = document.createElement("div");
  iconContainer.style.display = "flex";
  iconContainer.style.justifyContent = "space-between";
  iconContainer.style.alignItems = "center";
  iconContainer.style.marginTop = "8px";
  return iconContainer;
}

function createDeleteIcon(note) {
  const deleteIcon = document.createElement("i");
  deleteIcon.className = `fa-solid fa-xmark delete-icon-${note.note_id}`;
  deleteIcon.style.cursor = "pointer";
  deleteIcon.title = "Delete note";
  deleteIcon.style.color = "red";
  deleteIcon.style.opacity = "0.55";
  deleteIcon.onclick = function () {
    console.log("Delete action clicked");
    deleteNote(note.note_id);
  };
  return deleteIcon;
}

function createEditIcon(note) {
  const editIcon = document.createElement("i");
  editIcon.className = `fa-solid fa-pen edit-icon-${note.note_id} edit-icon`;
  editIcon.style.cursor = "pointer";
  editIcon.title = "Edit note";
  editIcon.classList.add(note.note_id);
  editIcon.onclick = function () {
    handleEditClick(note, editIcon.parentElement);
  };
  return editIcon;
}

function revertToParagraph(noteId, noteTextToEdit, iconContainer) {
  // Show the edit icon again when editing is discarded or confirmed
  removeSpinner();
  const editIcon = iconContainer.querySelector(`.fa-pen`);
  if (editIcon) {
    editIcon.style.display = "inline-block";
  }

  const textarea = document.querySelector(`.${noteId}.textarea-editable`);
  if (!textarea) {
    console.error("Textarea for editing not found");
    return;
  }

  // Create a new div element to replace the textarea
  const newNoteTextElement = document.createElement("div");
  newNoteTextElement.className = `note-text ${noteId}`;

  // Use the marked library to parse the Markdown to HTML
  newNoteTextElement.innerHTML = marked.parse(noteTextToEdit);

  textarea.replaceWith(newNoteTextElement);

  // Remove confirm, discard, and pin buttons
  const confirmButton = iconContainer.querySelector(".fa-circle-check");
  const discardButton = iconContainer.querySelector(".fa-circle-xmark");
  const pinButton = iconContainer.querySelector(".fa-thumbtack");

  if (confirmButton) confirmButton.remove();
  if (discardButton) discardButton.remove();
  if (pinButton) pinButton.remove();
}

function handleEditClick(note, iconContainer) {
  console.log("Edit action clicked for note ID: ", note.note_id);

  // Hide the edit icon when editing starts
  const editIcon = iconContainer.querySelector(
    `.fa-pen.edit-icon-${note.note_id}`
  );
  editIcon.style.display = "none";

  // When editing, set the textarea value to raw Markdown content of the note
  const noteTextElement = document.querySelector(`.note-text.${note.note_id}`);
  const noteTextToEdit = note.note_text; // Use raw Markdown content

  // Replace the p element with a textarea
  const textarea = document.createElement("textarea");
  textarea.className = `${note.note_id} textarea-editable`;
  textarea.value = noteTextToEdit;
  textarea.style.width = "100%";
  textarea.style.padding = "0.5rem";
  textarea.style.resize = "vertical"; // Allow the textarea to be resized vertically

  const computedStyle = window.getComputedStyle(noteTextElement);
  const height =
    noteTextElement.offsetHeight +
    parseInt(computedStyle.marginTop, 10) +
    parseInt(computedStyle.marginBottom, 10);
  textarea.style.height = `${height}px`;

  noteTextElement.replaceWith(textarea);

  // Create and add buttons
  const confirmButton = createButton(
    `fa-solid fa-circle-check ${note.note_id}`,
    "Confirm changes",
    "green",
    async () => {
      if (noteTextToEdit === textarea.value) {
        revertToParagraph(note.note_id, noteTextToEdit, iconContainer);
      } else {
        revertToParagraph(note.note_id, textarea.value, iconContainer);
        await updateNote(
          note.note_id,
          textarea.value,
          note.is_pinned === 1 ? true : false
        );
      }

      fetchNotes();
    }
  );

  const discardButton = createButton(
    "fa-solid fa-circle-xmark",
    "Discard changes",
    "red",
    () => {
      revertToParagraph(note.note_id, noteTextToEdit, iconContainer);
    }
  );

  const pinButton = createButton(
    `fa-solid fa-thumbtack ${note.note_id}`,
    "Pin note",
    "blue",
    async () => {
      // async here to be able to use await later
      try {
        // Updating the note with the new pin status
        await updateNote(
          note.note_id,
          textarea.value,
          note.is_pinned === 1 ? false : true
        );
        fetchNotes(); // Refetch notes to update the list after pinning/unpinning
      } catch (error) {
        console.error("Error updating note pin status:", error);
      }
    }
  );

  iconContainer.appendChild(pinButton);
  iconContainer.appendChild(discardButton);
  iconContainer.appendChild(confirmButton);
}

function createButton(iconClass, title, color, onClickHandler) {
  const button = document.createElement("i");
  button.className = iconClass;
  button.style.cursor = "pointer";
  button.title = title;
  button.style.color = color;
  button.onclick = onClickHandler;
  return button;
}

function updateNote(noteId, updatedText, toPin = false) {
  console.log("Updating note with ID: ", noteId);

  const updatedNoteData = {
    note_text: updatedText,
    is_pinned: toPin ? 1 : 0,
    updated_date: new Date().toLocaleDateString("en-GB"),
    updated_time: new Date().toLocaleTimeString("en-GB", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };

  return new Promise((resolve, reject) => {
    fetch(
      `https://eopcsfkmlwkil4fzaqz6u4nqam0unwxc.lambda-url.eu-west-2.on.aws/?noteId=${noteId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedNoteData),
      }
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Update successful:", data);
        resolve(data);
      })
      .catch((error) => {
        console.error("Error:", error);
        reject(error);
      });
  });
}

const createErrorIcon = (elementToAttach, errorText, centered = false) => {
  // Remove existing error icon and text if they exist
  const existingError = document.querySelector(".error-icon-text-container");
  if (existingError) {
    existingError.remove();
  }

  // Create the container div
  const errorContainer = document.createElement("div");
  errorContainer.className = "error-icon-text-container";
  errorContainer.style.display = "flex";
  errorContainer.style.alignItems = "center";
  errorContainer.style.gap = "10px";
  errorContainer.style.color = "red"; // Sets the text color same as the icon
  errorContainer.style.opacity = "0"; // Start with low opacity
  errorContainer.style.filter = "blur(10px)"; // Start with blur
  errorContainer.style.transition = "opacity 0.8s, filter 0.8s"; // Transition effect

  // Create the error icon
  const errorIcon = document.createElement("i");
  errorIcon.className = "fa-solid fa-circle-exclamation";

  // Create the error text element
  const errorTextElement = document.createElement("span");
  errorTextElement.textContent = errorText;
  errorTextElement.style.opacity = "0.6";
  errorTextElement.style.fontWeight = "600";

  // Append the icon and text to the container
  errorContainer.appendChild(errorIcon);
  errorContainer.appendChild(errorTextElement);

  // Append the error container to the body to calculate its dimensions
  document.body.appendChild(errorContainer);

  // Transition to full opacity and no blur after appending
  setTimeout(() => {
    errorContainer.style.opacity = "1";
    errorContainer.style.filter = "blur(0)";
  }, 0);

  const elementToAttachTo = document.querySelector(elementToAttach);
  const elementRect = elementToAttachTo.getBoundingClientRect();

  // Setting the position of the error container
  errorContainer.style.position = "absolute";
  errorContainer.style.left = `${elementRect.right + 20}px`; // Adding x pixels to the right edge

  if (centered) {
    // Align the vertical center of the error container with the vertical center of the element
    const elementCenterY = elementRect.top + elementRect.height / 2;
    const containerHeight = errorContainer.offsetHeight;
    const containerTop = elementCenterY - containerHeight / 2;
    errorContainer.style.top = `${containerTop}px`;
  } else {
    // Aligning top edge
    errorContainer.style.top = `${elementRect.top}px`;
  }

  setTimeout(() => {
    errorContainer.style.animationName = "horizontal-shaking";
    errorContainer.style.animationDuration = "0.5s";
    errorContainer.style.animationIterationCount = "1";
  }, 400);

  setTimeout(() => {
    // Smoothly fade out opacity and then remove the error container
    errorContainer.style.opacity = "0";
    errorContainer.style.filter = "blur(10px)";
    setTimeout(() => {
      errorContainer.remove();
    }, 800); // Matching the transition duration
  }, 2000);
};

const removeSpinner = () => {
  const spinner = document.querySelector(".ispinner");
  if (spinner) {
    spinner.remove();
  }
};

window.addEventListener("message", async (event) => {
  if (event.data === "group_id_set") {
    try {
      const noteData = await fetchNotes();
      parseNoteData(noteData);
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  }
});
