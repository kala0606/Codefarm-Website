/**
 * Test script to fill the Codefarm application form with witty coder jokes
 * Run this in the browser console when on the application page
 */

(function() {
    const form = document.getElementById('applicationForm');
    if (!form) {
        console.error('Form not found! Make sure you are on the application page.');
        return;
    }
    
    // Witty brutalist coder answers
    const testData = {
        fullName: 'Null Pointer Exception',
        email: 'undefined@null.co',
        phone: '+1 404 NOT-FOUND',
        location: 'Stack Overflow, Internet',
        dob: '1970-01-01', // Unix epoch
        gender: 'Binary',
        hearAbout: 'Heard about it from a friend who said "It works on my machine." Also, Stack Overflow recommended it after I searched "how to make art with code".',
        background: 'Self-taught through infinite loops and stack traces. Professional debugger with 10+ years of experience in rubber duck programming. Currently working as a full-stack developer (I stack things, then they fall over).',
        experience: 'Languages: JavaScript (the good parts), Python (snake_case enthusiast), C++ (because I hate myself). Visual Arts: ASCII art, terminal-based animations, and that one time I made a CSS triangle. Familiar with Processing, p5.js, and the existential dread that comes with `npm install`.',
        goals: 'Want to learn how to make my code output something other than errors. Specifically interested in: 1) Making triangles that don\'t crash my browser, 2) Understanding why my Delaunay triangulation looks like spaghetti, 3) Turning my console.log() statements into actual physical objects. Dream: Create a pen plotter that draws my git commit history as art.'
    };
    
    // Fill the form
    document.getElementById('fullName').value = testData.fullName;
    document.getElementById('email').value = testData.email;
    document.getElementById('phone').value = testData.phone;
    document.getElementById('location').value = testData.location;
    document.getElementById('dob').value = testData.dob;
    document.getElementById('gender').value = testData.gender;
    document.getElementById('hearAbout').value = testData.hearAbout;
    document.getElementById('background').value = testData.background;
    document.getElementById('experience').value = testData.experience;
    document.getElementById('goals').value = testData.goals;
    
    console.log('✅ Form filled with witty coder answers!');
    console.log('📝 Review the form and click Submit when ready.');
    
    // Scroll to form
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
})();
