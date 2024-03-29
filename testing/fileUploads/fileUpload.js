const createSpinner = (elementToAttach, spinnerSize, side = "right") => {
  // Remove existing spinner if it exists
  removeSpinner();

  // New spinner element
  const spinner = document.createElement("div");
  spinner.className = "spinner";
  spinner.style.position = "absolute";
  spinner.style.zIndex = "9999"; // High z-index to ensure visibility
  spinner.style.fontSize = `${spinnerSize}px`; // Spinner size
  spinner.innerHTML = `
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
  `.trim();

  // Initially append the spinner to the body to measure its dimensions
  document.body.appendChild(spinner);

  // Get the target element
  const element = document.querySelector(elementToAttach);
  if (!element) {
    console.error(`Element to attach to (${elementToAttach}) not found.`);
    return;
  }

  // Calculate position
  const rect = element.getBoundingClientRect();
  const spinnerRect = spinner.getBoundingClientRect();

  // Set top position to align centers
  const topPosition = rect.top + rect.height / 2 - spinnerRect.height / 2;
  spinner.style.top = `${topPosition}px`;

  // Set left or right position
  if (side === "right") {
    spinner.style.left = `${rect.right + 10}px`; // 10px offset from the right side
  } else {
    spinner.style.left = `${rect.left - spinnerRect.width - 10}px`; // 10px offset from the left side
  }
};

const createSpinnerAsElement = function (
  elementToSelector,
  spinnerSize,
  leftMargin = "1rem",
  rightMargin = "1rem"
) {
  // Select the parent element to attach the spinner to
  const parentElement = document.querySelector(elementToSelector);
  if (!parentElement) {
    console.error(`Parent element (${elementToSelector}) not found.`);
    return;
  }

  // Remove existing spinner if it exists within the parent element
  const existingSpinner = parentElement.querySelector(".spinner");
  if (existingSpinner) {
    existingSpinner.remove();
  }

  // New spinner element
  const spinner = document.createElement("div");
  spinner.className = "spinner";
  spinner.style.fontSize = `${spinnerSize}px`; // Spinner size
  spinner.innerHTML = `
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
    <div class="spinner-blade"></div>
  `.trim();

  // Set margins from parameters
  spinner.style.marginLeft = leftMargin;
  spinner.style.marginRight = rightMargin;

  // Append spinner to the parent element
  parentElement.appendChild(spinner);
};

const removeSpinner = () => {
  // Select all spinner elements
  const spinners = document.querySelectorAll(".spinner");
  // Loop through all spinner elements and remove them
  spinners.forEach((spinner) => {
    spinner.parentNode.removeChild(spinner);
  });
};

// Function to set spinner size for a specific spinner
const setSpinnerSize = (spinner, size) => {
  if (spinner) {
    spinner.style.setProperty("--spinner-size", `${size}px`);
  }
};

document.querySelector(".inputfile").addEventListener("change", (event) => {
  const files = event.target.files;
  const fileList = document.querySelector(".selected-files-text");
  console.log(fileList);
  fileList.innerHTML = "";
  for (let i = 0; i < files.length; i++) {
    fileList.innerHTML += `<li>${files[i].name}</li>`;
  }
});

document.querySelector(".upload-btn").addEventListener("click", () => {
  // Get the selected file
  const files = document.querySelector(".inputfile").files;
  const fileList = document.querySelector(".selected-files-text");
  console.log(fileList);
  fileList.innerHTML = "";
  for (let i = 0; i < files.length; i++) {
    fileList.innerHTML += `<li>${files[i].name}</li>`;
  }

  const file = files[0];
  console.log(`Starting upload for: ${file.name}`);
  document.querySelector(".uploading-text").innerText = `Starting upload`;
  removeSpinner();
  createSpinner(".uploading-text", 14, "right");

  // Create URL with query parameters
  const lambdaUrl =
    "https://jvvtcm6ogy3bybmpnxw4gwwtre0drgzl.lambda-url.eu-west-2.on.aws/";
  const queryParams = new URLSearchParams({
    file_name: file.name,
    content_type: file.type,
  });

  let startTime = Date.now(); // Start time of the upload
  let lastLoaded = 0; // Last loaded amount to calculate speed

  // Make a request to Lambda function
  fetch(`${lambdaUrl}?${queryParams}`, {
    method: "GET",
  })
    .then((response) => response.json())
    .then((data) => {
      // Upload the file to the presigned URL
      const xhr = new XMLHttpRequest();
      const abortBtn = document.querySelector(".cancel-upload-btn");
      xhr.open("PUT", data.url, true);
      xhr.setRequestHeader("Content-Type", file.type);

      // Update progress
      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          console.log(`Uploading: ${percentage}%`); // Log the upload progress percentage
          removeSpinner();
          document.querySelector(".uploading-text").innerText = `Uploading`;
          document.getElementById("progressBar").value = percentage.toString();
          document.getElementById(
            "progressPercentage"
          ).innerText = `${percentage}%`;
          const uploadCompleteIcon = document.createElement("i");
          uploadCompleteIcon.className = "fa-solid fa-circle-check";
          if (percentage === 100) {
            document.getElementById("progressPercentage").innerHTML = "";
            document
              .getElementById("progressPercentage")
              .appendChild(uploadCompleteIcon);
            document.getElementById("uploadSpeed").innerHTML = "";
            fetchFileList();
            document.querySelector(
              ".uploading-text"
            ).innerText = `Upload complete`;
            createSpinnerAsElement(".files-heading", 18);
          }
          // calculate upload speed
          const currentTime = Date.now();
          const timeElapsedInSeconds = (currentTime - startTime) / 1000;
          const bytesPerSecond =
            (event.loaded - lastLoaded) / timeElapsedInSeconds;
          const speedInMbps = (bytesPerSecond / 1024 / 1024).toFixed(2);
          document.getElementById(
            "uploadSpeed"
          ).innerText = `${speedInMbps} MB/s`;

          lastLoaded = event.loaded; // Update last loaded amount
          startTime = currentTime; // Reset the start time for the next calculation
        }
      };

      abortBtn.onclick = () => {
        xhr.abort(); // This will abort the upload
        document.getElementById("progressBar").value = 0;
        document.getElementById("progressPercentage").innerText = "Aborted";
        document.getElementById("uploadSpeed").innerText = `Speed: 0.00 MB/s`;
        document.querySelector(".uploading-text").innerText = `Upload aborted`;
        console.log("Upload aborted");
      };

      // Log when the upload is complete
      xhr.onload = function () {
        if (xhr.status === 200) {
          console.log("Upload complete"); // Log the successful upload
          document.querySelector(".progress").innerText = "Upload complete";
          fetchFileList();
        } else {
          console.error("Upload failed"); // Log the upload failure
          document.querySelector(".progress").innerText = "Upload failed";
        }
      };

      xhr.onerror = function () {
        console.error("Upload error"); // Log the upload error
        document.querySelector(".progress").innerText = "Upload error";
      };

      xhr.send(file);
    })
    .catch((error) => console.error("Error:", error));
});

// Function to calculate and display upload speed
function calculateSpeed(loaded, startTime, lastLoaded) {
  const currentTime = Date.now();
  const timeElapsedInSeconds = (currentTime - startTime) / 1000;
  const bytesPerSecond = (loaded - lastLoaded) / timeElapsedInSeconds;
  const speedInKbps = (bytesPerSecond / 1024).toFixed(2);

  document.getElementById(
    "uploadSpeed"
  ).innerText = `Speed: ${speedInKbps} KB/s`;

  // Reset the start time for the next calculation
  startTime = currentTime;
}

// Function to fetch file list and generate HTML
function fetchFileList() {
  const lambdaUrl =
    "https://24qvw7hqnnxazjuc5ahawcb43a0qdzwp.lambda-url.eu-west-2.on.aws/";
  fetch(lambdaUrl)
    .then((response) => response.json())
    .then((files) => {
      console.log(files);
      const fileList = document.getElementById("file-list");
      fileList.innerHTML = ""; // Clear existing list items if any

      if (files.length === 0) {
        const noFilesMessage = document.createElement("p");
        noFilesMessage.innerText = "No files uploaded";
        noFilesMessage.classList.add("no-files-message");
        fileList.appendChild(noFilesMessage);
      }
      removeSpinner();
      // Iterate over the files and make an element for each file with a download and delete icon/button
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Create the container for each file
        const fileContainer = document.createElement("div");
        fileContainer.className = "file-to-download-container";

        // Create the download link with the FontAwesome icon
        const downloadLink = document.createElement("a");
        downloadLink.className = "file-download-link";
        downloadLink.href = file.DownloadUrl;
        downloadLink.download = file.Key;
        downloadLink.innerHTML = `<i class="fa-regular fa-circle-down"></i>`; // Insert icon only

        // Create a span for the file name
        const fileNameSpan = document.createElement("span");
        fileNameSpan.textContent = file.Key;

        // Create the delete icon
        const deleteIcon = document.createElement("i");
        deleteIcon.className = `fa-solid fa-trash-can delete-${i}`; // Unique class for each delete icon
        deleteIcon.onclick = () => {
          deleteFile(file.Key);
          createSpinner(`.delete-${i}`, 12, "right"); // Attach to the right delete icon
        };

        // Append elements to the container
        fileContainer.appendChild(downloadLink);
        fileContainer.appendChild(fileNameSpan);
        fileContainer.appendChild(deleteIcon);

        // Append the container to the file list
        fileList.appendChild(fileContainer);
      }
    })
    .catch((error) => console.error("Error:", error));
}

// Call the function to fetch and display the file list
fetchFileList();

function deleteFile(fileName) {
  const lambdaDeleteUrl =
    "https://igfzklwuqn5kwxn64icdmbekye0hndew.lambda-url.eu-west-2.on.aws/";
  const queryParams = new URLSearchParams({ file_name: fileName });

  fetch(`${lambdaDeleteUrl}?${queryParams}`, {
    method: "DELETE",
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message); // Log the successful deletion message
      fetchFileList(); // Refresh the file list
    })
    .catch((error) => console.error("Error:", error));
}

createSpinnerAsElement(".files-heading", 20);
