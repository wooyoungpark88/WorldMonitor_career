const mammoth = require('mammoth');
const fs = require('fs');

mammoth.extractRawText({path: "C:\\Users\\SKTelecom\\Desktop\\CareRadar_PRD_v1.0.docx"})
    .then(function(result){
        const text = result.value;
        const messages = result.messages;
        fs.writeFileSync("C:\\Users\\SKTelecom\\.gemini\\antigravity\\brain\\b7aed4ef-7fbe-4c78-9cc6-2fc0d49e07e7\\prd_analysis.md", text);
        console.log("Extraction complete.");
    })
    .catch(function(error) {
        console.error(error);
    });
