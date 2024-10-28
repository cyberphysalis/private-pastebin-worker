function handleError(error) {
  const status = error.status || ''
  let statusText = error.statusText === 'error' ? 'Unknown error' : error.statusText
  const responseText = error.responseText || ''
  alert(`Error ${status}: ${statusText}\n${responseText}\nView your console for more information`)
}

function deleteKey(name, passwd) {
    const url = `/${name}:${passwd}`
    let fd = new FormData()
    $.ajax({
      method: 'DELETE',
      url: url,
      data: fd,
      processData: false,
      success: () => {
        alert('Delete successfully')
        $(`#${name}`).parent().parent().remove()
      },
      error: handleError,
    })

}

window.addEventListener('DOMContentLoaded', () => {
  let cursor = ''
  const moreKeysButton = $('#more-keys-button')

  moreKeysButton.on('click', () => {
      getKeys(cursor)
  })

  function getMetadata(key) {
    const metadata = key.metadata
    if (!metadata) return { passwd: '', lastModified: '', postedAt: '' }
    return { 
      passwd: metadata.passwd, 
      lastModified: new Date(metadata.lastModified).toLocaleString(),
      postedAt: new Date(metadata.postedAt).toLocaleString(),
    }
  }

  function resolveKeys(res) {
    const keys = res.keys
    const keyTable = $('#key-table-body')
    keys.forEach(key => {
      const metadata = getMetadata(key)
      const keyItem = $(`
        <tr>
          <td><a href="/${key.name}">${key.name}</a></td>
          <td>${metadata.passwd}</td>
          <td>${metadata.lastModified}</td>
          <td>${metadata.postedAt}</td>
          <td><button id="${key.name}" class="small-button delete-button" onclick="deleteKey('${key.name}', '${metadata.passwd}')">Delete</button></td>
        </tr>
      `)
      keyTable.append(keyItem)
    })
    if (res.list_complete) {
      if (!moreKeysButton.hasClass('hidden')) {
        moreKeysButton.addClass('hidden')
      }
    } else {
      cursor = res.cursor
      moreKeysButton.removeClass('hidden')
    }
  }


  function getKeys(cursor) {
    const url = cursor === '' ? '/admin/keys' : `/admin/keys?cursor=${cursor}`
    $.ajax({
      url: url,
      success: res => {
        resolveKeys(res)
      },
      error: handleError,
    })
  }


  getKeys(cursor)

})
