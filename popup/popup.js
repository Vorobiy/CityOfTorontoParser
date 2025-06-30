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
        let serialdates = [];

        for (let i = 1; i < raw_data.length; i++) {
          const rowName = raw_data[i][0]?.toString().trim().toLowerCase();
          if (rowName === nameUser) {
            identifiedRowNumber = i;
            identifiedRowSchedule = raw_data[i-1];
            serialdates = raw_data[1];
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

         /*
    
        PART 2: FORMATTING THE DATA EXTRACTED AND GETTING READY AS PAYLOAD FOR GOOGLE CALENDAR
    
        */

        const colsToRemove = [19, 18, 10, 9, 2, 1, 0];  

        for (const colIndex of colsToRemove) {
        identifiedRowSchedule.splice(colIndex, 1);
        }

      console.log(identifiedRowSchedule);

      const scheduledata = identifiedRowSchedule;
      const hoursworked = identifiedRowSchedule[19];
      serialdates.splice(0, 1);

      console.log(serialdates);

      //convert serialdates to actual dates
        function excelDateToDateString(serial) {
        const utc_days = serial - 25569;
        const utc_value = utc_days * 86400;
        const date = new Date(utc_value * 1000);
        return date.toISOString().split("T")[0]; // returns "YYYY-MM-DD"
      }

      function formatForGoogleCalendar(dateSerial, timeString, tzOffset = "-04:00") {
        const date = excelDateToDateString(dateSerial); // e.g., "2025-06-30"
        return `${date}T${timeString}:00${tzOffset}`;  // "2025-06-30T10:00:00-04:00"
      }
      //store them into an array 

      let dates = [];
      for (let i = 0; i < serialdates.length; i++) {
        const serial = serialdates[i];
        if (typeof serial === "number" && !isNaN(serial)) {
          dates[i] = excelDateToDateString(serial);
        } else {
          dates[i] = null;
        }
      }

      console.log(dates);

      function padTime(t) {
        const [h, m] = t.split(":");
        return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
      }


      //disassemble the time start and time end into two different variables
    function disassembleTime(timeStr) {
      if (!timeStr || typeof timeStr !== "string" || timeStr.trim().toUpperCase() === "OFF") {
        return null;
      }

      // Remove all whitespace
      timeStr = timeStr.replace(/\s+/g, "");

      let time1 = "";
      let time2 = "";
      let j = 0;

      // Extract characters before the dash
      while (j < timeStr.length && timeStr[j] !== "-") {
        time1 += timeStr[j];
        j++;
      }

      // Skip the dash if present
      if (timeStr[j] === "-") j++;

      // Extract characters after the dash
      while (j < timeStr.length) {
        time2 += timeStr[j];
        j++;
      }

      // If no dash was found, treat entire string as time1 and leave time2 empty
      if (time2 === "") {
        time2 = null;
      }

      // Return trimmed times just in case
      return {
        time1: time1.trim(),
        time2: time2 ? time2.trim() : null,
      };
    }

    function to24Hour(start, end) {
      const [sH, sM] = start.split(":").map(Number);
      let [eH, eM] = end.split(":").map(Number);

      if (eH < sH || (eH === sH && eM <= sM)) {
        eH += 12;                  // bump into the afternoon / evening
      }
      return `${eH.toString().padStart(2, "0")}:${eM
        .toString()
        .padStart(2, "0")}`;
    }
      

      //assemble 1 constant + 3 variables: "SHIFT" + actual dates + start time + end time  into one array for payload.
      const events = [];

      for (let i = 0; i < scheduledata.length; i++) {
        const entry = scheduledata[i];
        const dateSerial = serialdates[i];

        if (!entry || entry.toUpperCase().trim() === "OFF") continue;
        if (typeof dateSerial !== "number" || isNaN(dateSerial)) continue;

        const { time1, time2 } = disassembleTime(entry);
        if (!time1 || !time2) continue;             // skip malformed rows

        // Pad times and make sure the end time is in 24-hour format
        const startHHMM = padTime(time1);
        const endHHMM   = to24Hour(startHHMM, padTime(time2));

        events.push({
          summary: "Shift",
          start: { dateTime: formatForGoogleCalendar(dateSerial, startHHMM) },
          end:   { dateTime: formatForGoogleCalendar(dateSerial, endHHMM) }
        });
      }
      /*
    
        PART 3: SENDING PAYLOAD TO GOOGlE CALENDAR
    
      */

        //write it to json
        const jsonPayload = JSON.stringify(events, null, 2);
        console.log("Google Calendar Events Payload:", jsonPayload);

        chrome.runtime.sendMessage(
        { cmd: "addEvents", events }, // payload
        res => console.log("BG response:", res)
      );
  
      } catch (error) {
        console.error("Error in extract function:", error);
        document.getElementById("output").textContent = "Error fetching or processing the file.";
      }

      

      

      
      
    };

    reader.readAsArrayBuffer(file);

   


    

    
  });
});


