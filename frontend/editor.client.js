const SEP = ':'

function parsePath(pathname) {
  let role = "", ext = ""
  if (pathname[2] === "/") {
    role = pathname[1]
    pathname = pathname.slice(2)
  }
  let startOfExt = pathname.indexOf(".")
  if (startOfExt >= 0) {
    ext = pathname.slice(startOfExt)
    pathname = pathname.slice(0, startOfExt)
  }
  let endOfShort = pathname.indexOf(SEP)
  if (endOfShort < 0) endOfShort = pathname.length // when there is no SEP, passwd is left empty
  const short = pathname.slice(1, endOfShort)
  const passwd = pathname.slice(endOfShort + 1)
  return { role, short, passwd, ext }
}

window.addEventListener('DOMContentLoaded', () => {
  const base_url = '{{BASE_URL}}'
  const deploy_date = new Date('{{DEPLOY_DATE}}')

  function getDateString(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    const second = date.getSeconds().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  }

  $('#deploy-date').text(getDateString(deploy_date))

  function isAdminUrlLegal(url) {
    try {
      url = new URL(url)
      return url.origin === base_url && url.pathname.slice(1).indexOf('/') === -1
    } catch (e) {
      if (e instanceof TypeError) {
        return false
      } else {
        throw e
      }
    }
  }

  const formatSize = (size) => {
    if (!size) return '0'
    if (size < 1024) {
      return `${size} Bytes`
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(2)} MB`
    } else {
      return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`
    }
  }

  // monitor input changes and enable/disable submit button
  let urlType = $('input[name="url-type"]:checked').val()
  let inputType = 'edit'
  let expiration = $('#paste-expiration-input').val()
  let passwd = ''
  let customName = '', adminUrl = '', file = null
  let isPrivate = false

  const NAME_REGEX = /^[a-zA-Z0-9+_\-\[\]*$@,;]{3,}$/
  const EXPIRE_REGEX = /^\d+\s*[smhdwMY]?$/
  const submitButton = $('#submit-button')
  const settingModel = $('#paste-setting-model')
  const submitConfirmButton = $('#submit-confirm-button')
  const submitCancelButton = $('#submit-cancel-button')
  const deleteButton = $('#delete-button')
  const pasteEditArea = $('#paste-textarea')
  const submitErrMsg = $('#submit-error-msg')
  const submitConfirmErrMsg = $('#submit-confirm-error-msg')

  function disableSubmitButton(reason) {
    submitButton.removeClass('enabled')
    submitErrMsg.text(reason)
  }

  function disableSubmitConfirmButton(reason) {
    submitConfirmButton.removeClass('enabled')
    submitConfirmErrMsg.text(reason)
  }

  function updateButtons() {
    const pasteNotEmpty = inputType === 'edit'
      ? pasteEditArea.prop('value').length > 0
      : file !== null
    
    let expirationValid = EXPIRE_REGEX.test(expiration)  // TODO: verify it
    if (!expiration) {
      expirationValid = true
    }
    const nameValid = urlType !== 'custom' || NAME_REGEX.test(customName)
    const adminUrlValid = urlType !== 'admin' || isAdminUrlLegal(adminUrl)

    // check if the submit button should be enabled
    if (!pasteNotEmpty) {
      disableSubmitButton('Paste is empty')
    } else {
      submitButton.addClass('enabled')
      submitErrMsg.text('')
    }

    // check if the submit confirm button should be enabled
    if (!expirationValid) {
      disableSubmitConfirmButton(`Expiration “${expiration}” not valid`)
    } else if (!nameValid) {
      disableSubmitConfirmButton(`The customized URL should satisfy regex ${NAME_REGEX}`)
    } else if (!adminUrlValid) {
      disableSubmitConfirmButton(`Admin URL “${adminUrl}” not valid`)
    } else {
      submitConfirmButton.addClass('enabled')
      submitConfirmErrMsg.text('')
    }

    if (urlType === 'admin') {
      submitConfirmButton.text('Update')
      deleteButton.removeClass('hidden')
    } else {
      submitConfirmButton.text('Submit')
      deleteButton.addClass('hidden')
    }

    if (adminUrlValid) {
      deleteButton.addClass('enabled')
      submitConfirmButton.prop('title', '')
    } else {
      deleteButton.removeClass('enabled')
      submitConfirmErrMsg.text(`The admin URL should be “${base_url}” followed by paste name`)
    }
  }

  updateButtons()

  function updateTabBar() {
    if (inputType === 'file') {
      $('#paste-tab-edit').removeClass('enabled')
      $('#paste-tab-file').addClass('enabled')
      $('#paste-file-show').addClass('enabled')
      $('#paste-edit').removeClass('enabled')
    } else {
      $('#paste-tab-file').removeClass('enabled')
      $('#paste-tab-edit').addClass('enabled')
      $('#paste-edit').addClass('enabled')
      $('#paste-file-show').removeClass('enabled')
    }
  }

  $('#paste-tab-file').on('input', event => {
    const files = event.target.files
    if (files.length === 0) return
    file = files[0]
    inputType = 'file'
    updateButtons()
    updateTabBar()
    const fileLine = $('#paste-file-line')
    fileLine.children('.file-name').text(file.name)
    fileLine.children('.file-size').text(formatSize(file.size))
  })

  $('#paste-tab-edit').on('click', () => {
    inputType = 'edit'
    updateButtons()
    updateTabBar()
  })

  const pasteEditAreaCopy = $("#paste-textarea-copy")
  pasteEditArea.on('input', event => {
    // set the element height to fit the content
    // https://stackoverflow.com/questions/2803880/is-there-a-way-to-get-a-textarea-to-stretch-to-fit-its-content-without-using-php
    // this featur can also be implemented by using the css property "field-sizing: content", but it is not supported by all browsers
    // pasteEditAreaCopy is used to calculate the height of the real textarea, it has the same value as the pasteEditArea
    pasteEditAreaCopy.prop('value', event.target.value)
    // scrollHeight is the height of the content
    const sh = pasteEditAreaCopy.prop('scrollHeight')
    event.target.style.height = sh + 'px'
    updateButtons()
  })

  $('#paste-private-checkbox').on('input', event => {
    isPrivate = event.target.checked
  })

  $('#paste-expiration-input').on('input', event => {
    expiration = event.target.value
    updateButtons()
  })

  $('#paste-passwd-input').on('input', event => {
    passwd = event.target.value
  })

  $('input[name="url-type"]').on('input', event => {
    urlType = event.target.value
    updateButtons()
  })

  $('#paste-custom-url-input').on('input', event => {
    customName = event.target.value
    updateButtons()
  })

  $('#paste-admin-url-input').on('input', event => {
    adminUrl = event.target.value
    updateButtons()
  })

  // submit the form
  submitButton.on('click', () => {
    if (submitButton.hasClass('enabled')) {
      // display setting model
      settingModel.removeClass('hidden')
    }
  })

  submitConfirmButton.on('click', () => {
    if (submitConfirmButton.hasClass('enabled')) {
      if (urlType === 'admin') {
        putPaste()
      } else {
        postPaste()
      }
    }
  })

  submitCancelButton.on('click', () => {
    settingModel.addClass('hidden')
    // set the radio button back to checked
    //if (!submitButton.hasClass('enabled')) {
    //  submitButton.addClass('enabled')
    //}
    //$("#paste-url-short-radio").prop("checked", true)
    //urlType = 'short'
    //updateButtons()
  })

  deleteButton.on('click', () => {
    if (deleteButton.hasClass('enabled')) {
      deletePaste()
    }
  })

  function putPaste() {
    prepareUploading()
    let fd = new FormData()
    if (inputType === 'file') {
      fd.append('c', file)
    } else {
      fd.append('c', pasteEditArea.prop('value'))
    }

    if (expiration.length > 0) fd.append('e', expiration)
    if (passwd.length > 0) fd.append('s', passwd)
    if (isPrivate) fd.append('p', 'true')

    $.ajax({
      method: 'PUT',
      url: adminUrl,
      data: fd,
      processData: false,
      contentType: false,
      success: (data) => {
        renderUploaded(data)
      },
      error: handleError,
    })
  }

  function postPaste() {
    prepareUploading()
    let fd = new FormData()
    if (inputType === 'file') {
      fd.append('c', file)
    } else {
      fd.append('c', pasteEditArea.prop('value'))
    }

    if (expiration.length > 0) fd.append('e', expiration)
    if (passwd.length > 0) fd.append('s', passwd)

    if (urlType === 'long') fd.append('p', 'true')
    if (urlType === 'custom') fd.append('n', customName)
    if (isPrivate) fd.append('p', 'true')

    $.post({
      url: base_url,
      data: fd,
      processData: false,
      contentType: false,
      success: (data) => {
        renderUploaded(data)
      },
      error: handleError,
    })
  }

  function deletePaste() {
    prepareUploading()
    let fd = new FormData()
    $.ajax({
      method: 'DELETE',
      url: adminUrl,
      data: fd,
      processData: false,
      success: () => {
        alert('Delete successfully')
      },
      error: handleError,
    })
  }

  function prepareUploading() {
    resetCopyButtons()
    $('#submit-button').removeClass('enabled')
    $('#paste-uploaded-panel input').prop('value', '')
  }

  function renderUploaded(uploaded) {
    // the uploaded-panel is in the top, scroll to the top
    window.scrollTo(0, 0)

    $('#paste-uploaded-panel').removeClass('hidden')
    $('#uploaded-url').prop('value', uploaded.url)
    $('#uploaded-admin-url').prop('value', uploaded.admin)
    if (uploaded.suggestUrl) {
      $('#uploaded-suggest-url').prop('value', uploaded.suggestUrl)
    }
    if (uploaded.expire) {
      $('#uploaded-expiration').prop('value', uploaded.expire)
    }
    settingModel.addClass('hidden')
    updateButtons()
  }

  $('.copy-button').on('click', event => {
    const button = event.target
    const input = button.parentElement.firstElementChild
    input.focus()
    input.select()
    try {
      document.execCommand('copy')
      resetCopyButtons()
      button.textContent = 'Copied'
    } catch (err) {
      alert('Failed to copy content')
    }
  })

  function resetCopyButtons() {
    $('.copy-button').text('Copy')
  }

  function handleError(error) {
    const status = error.status || ''
    let statusText = error.statusText === 'error' ? 'Unknown error' : error.statusText
    const responseText = error.responseText || ''
    alert(`Error ${status}: ${statusText}\n${responseText}\nView your console for more information`)
    $('#submit-button').addClass('enabled')
  }

  // in this fork，only admin can edit paste
  function initAdmin() {
    const { role, short, passwd, ext } = parsePath(location.pathname)
    if (role === 'e') {
      urlType = 'admin'
      adminUrl = `${base_url}/${short}`
      $('#paste-url-admin-radio').click()
      $('#paste-admin-url-input').val(adminUrl)
      updateButtons()
      $.ajax({
        url: "/" + short,
        success: paste => {
          pasteEditArea.val(paste)
          updateButtons()
        },
        error: handleError,
      })
    }
  }
  initAdmin()
})
