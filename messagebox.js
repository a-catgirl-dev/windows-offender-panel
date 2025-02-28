const iconBitflags = {
    0: 0x00000040, // MB_ICONINFORMATION/MB_ICONASTRISK... whatever the difference is
    1: 0x00000020, // MB_ICONQUESTION
    2: 0x00000030, // MB_ICONWARNING/MB_ICONEXCLAIMATION... whatever the difference is.
    3: 0x00000010, // MB_ICONERROR
}

const controlBitflags = {
    0: 0x00000000, // MB_OK
    1: 0x00000001, // MB_OKCANCEL
    2: 0x00000004, // MB_YESNO
    3: 0x00000003, // MB_YESNOCANCEL
    4: 0x00000005, // MB_RETRYCANCEL
    5: 0x00000006, // MB_CANCELTRYCONTINUE
    6: 0x00000002, // MB_ABORTRETRYIGNORE
    7: 0x00004000, // MB_SENDHELP
}

function onMessageboxAction() {
    const iconWrapper = document.getElementById("msgbox-icon-selection");
    const controlWrapper = document.getElementById("msgbox-control-selection");
    const iconSelectedValue = iconWrapper.selectedOptions[0].value;
    const iconBitflag = iconBitflags[iconSelectedValue];

    const controlSelectedValue = controlWrapper.selectedOptions[0].value;
    const controlBitflag = controlBitflags[controlSelectedValue];

    const title = document.getElementById("msgbox-title").value;
    const body = document.getElementById("msgbox-body").value;

    const bitwiseord = iconBitflag | controlBitflag;

    invokeRequest(`messagebox:${title}:${body}:${bitwiseord}`);
}
