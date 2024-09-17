/*
This sequencer assumes that you will use Sets as a "song", and Patches as "sections of a song."
The IAC Bus must be active in Audio MIDI Setup.

In the changes objects, each key is the Beat Position. I've made comments to show how those correspond with Bar values. 
As it is currently written, this could go at the Concert level, and sequence an entire show.

An alternate approach is to save a version of the script, per song, and put them at the Set level.
If you use that approach, then bankLSB will be identical for the whole changes array.
IMPORTANT: bankMSB will *always* be zero, unless you manually change it in the Concert/Set/Patch attributes. BankLSB selects the Set bank by default.
*/

// SEQUENCER

// Copy and paste additional lines to sequence patch changes:
var changes = {
    1: { bankMSB: 0, bankLSB: 0, program: 0 },  // Go to Set 1, Patch 1, at Bar 1
    5: { bankMSB: 0, bankLSB: 0, program: 1 },  // Go to Set 1, Patch 2, at Bar 2 (assuming you are in 4/4)
    // Make bankLSB identical if you want 1 Set to equal 1 song.
    // The following format would work at the concert level for a continuous performance:
    9: { bankMSB: 0, bankLSB: 1, program: 0 },  // Go to Set 2, Patch 1, at Bar 3
    13: { bankMSB: 0, bankLSB: 1, program: 1 }, // Go to Set 2, Patch 2, at Bar 4
    17: { bankMSB: 0, bankLSB: 2, program: 0 }  // Go to Set 3, Patch 1, at Bar 5
};

// STOP HERE
// Do not edit below this line unless you know JavaScript
/*******************************************/
var NeedsTimingInfo = true;
var firstBeat = null;  // This will track the first exact downbeat we find

function Reset() {
    firstBeat = null;  // Reset the firstBeat when transport is reset
}

function ProcessMIDI() {
    var timingInfo = GetTimingInfo();
    
    // Only process if the engine is currently playing
    if (!timingInfo.playing) {
        return;  // Do nothing if playback is stopped
    }

    // Set the first exact downbeat if it hasn't been set yet
    if (firstBeat === null) {
        firstBeat = Math.floor(timingInfo.blockStartBeat);  // Find the first full beat (align with host timeline)
    }

    // Iterate over the changes object
    Object.keys(changes).forEach(function(beat) {
        var targetBeat = firstBeat + parseInt(beat);  // Align the change with the first downbeat (no offset)

        // Ensure that we send the ProgramChange and Bank Select at the correct beats within the processing block
        if (targetBeat >= timingInfo.blockStartBeat && targetBeat < timingInfo.blockEndBeat) {
            var change = changes[beat];

            // Send Bank Select MSB (Control Change #0)
            var ccMSB = new ControlChange;
            ccMSB.number = 0;  // CC#0 is Bank Select MSB
            ccMSB.value = change.bankMSB;  // Always 0 as per instructions
            ccMSB.sendAtBeat(targetBeat);  // Send Bank Select MSB at the target beat

            // Send Bank Select LSB (Control Change #32)
            var ccLSB = new ControlChange;
            ccLSB.number = 32;  // CC#32 is Bank Select LSB
            ccLSB.value = change.bankLSB;  // Select the bank using LSB
            ccLSB.sendAtBeat(targetBeat);  // Send Bank Select LSB at the target beat

            // Send the Program Change
            var pc = new ProgramChange;
            pc.number = change.program;  // Set the program change number
            pc.sendAtBeat(targetBeat);   // Send the program change at the target beat
        }
    });
}

function HandleMIDI(event) {
    // No-op (ignore incoming MIDI events)
}
