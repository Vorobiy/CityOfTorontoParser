// popup.js

/*

PART 1: FIND YOUR NAME AND STORE RELEVANT INFO

*/ 


document.addEventListener("DOMContentLoaded", () => {
  const submitBtn = document.getElementById("submit");

  submitBtn.addEventListener("click", async () => {
    const nameInput = document.getElementById("fname");
    const nameUser = nameInput.value.trim().toLowerCase();
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    const reader = new FileReader();   
   

    // 2. Parse workbook and extract data
    reader.onload = function (e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const first_sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw_data = XLSX.utils.sheet_to_json(first_sheet, { header: 1 });

        let identifiedRowNumber = -1;
        let identifiedRowSchedule = [];

        for (let i = 1; i < raw_data.length; i++) {
          const rowName = raw_data[i][0]?.toString().trim().toLowerCase();
          if (rowName === nameUser) {
            identifiedRowNumber = i;
            identifiedRowSchedule = raw_data[i-1];
            break;
          }
        }

        // 4. Output result
        const output = document.getElementById("output");
        if (identifiedRowNumber === -1) {
          output.textContent = "Person not found or parsing failed.";
        } else {
          output.textContent = `Found at row ${identifiedRowNumber + 1}, Possible Schedules: ${identifiedRowSchedule}`;
        }
      } catch (error) {
        console.error("Error in extract function:", error);
        document.getElementById("output").textContent = "Error fetching or processing the file.";
      }
    };

    reader.readAsArrayBuffer(file);

    /*
    
    PART 2: FORMATTING THE DATA EXTRACTED AND GETTING READY AS PAYLOAD FOR GOOGLE CALENDAR
    
    */

    const colsToRemove = [19, 18, 10, 9, 2, 1];

    for (const colIndex of colsToRemove) {
    identifiedRowSchedule.splice(colIndex, 1);
    }

    const scheduledata = identifiedRowSchedule;
    const hoursworked = identifiedRowSchedule[19];

  });
});


