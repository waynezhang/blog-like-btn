class Like {

  getServer() {
    return 'https://like.lhzhang.com'
  }

  count(e) {
    this.request(e, 'GET', '/count')
  }

  like(e) {
    this.request(e, 'POST', '/like')
  }

  load() {
    document.querySelectorAll('.like-wrapper').forEach((e) => {
      this.count(e)
    })
  }

  getParams(e) {
    let param = ''
    param += 'shortname=' + e.getAttribute('like-shortname')
    param += '&identifier=' + encodeURIComponent(e.getAttribute('like-identifier'))

    const cookie = this.getCookie('_like_u')
    if (cookie) {
      param += '&user=' + cookie
    }

    const like_name = e.getAttribute('like-name')
    if (like_name) {
      param += '&name=' + encodeURIComponent(like_name)
    }

    const like_link = e.getAttribute('like-link')
    if (like_link) {
      param += '&link=' + encodeURIComponent(like_link)
    }

    return param
  }

  request(e, method, path) {
    let req = this.getHttpRequest()

    req.onreadystatechange = () => {
      if (req.readyState === 4 && req.status === 200) {
        this.updateWrapper(e, JSON.parse(req.responseText))
      }
    }

    let url = this.getServer() + path
    const params = this.getParams(e)

    if (method === 'GET') {
      url += '?' + params
    }

    req.open(method, url, true)
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
    if (method === 'POST') {
      req.send(params)
    } else {
      req.send(null)
    }
  }

  getHttpRequest() { 
    if (window.XMLHttpRequest) {
      return window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP')
    }
  }

  getCookie(name) {
    return decodeURIComponent((document.cookie.match(new RegExp('\b?' + name.replace(/([^\s\w])/g,"\\$1") + '=(.*?)(?:;|$)','i')) || [null,''])[1])
  }

  setCookie(name, val) {
    if (name && val) {
      document.cookie = name+ '=' + encodeURIComponent(val) + '; path=/; expires=Thu, 15 Oct 2099 00:00:00 GMT'
    }
  }

  updateWrapper(e, result) {
    if (!result || !result.user) {
      return console.error('error result')
    }

    while(e.firstChild) {
      e.removeChild(e.firstChild)
    }

    let n = document.createElement('span')
    n.className = 'like-button'

    const like_btn = e.getAttribute('like-btn')
    n.innerHTML = like_btn ? like_btn : "like"

    if (result.liked) {
      n.className += ' liked'
      e.style.cursor = 'default'
    } else {
      n.addEventListener('click', () => this.like(e))
      e.style.cursor = 'pointer'
    }

    e.appendChild (n)

    let c = document.createElement('span')
    c.className = 'like-count'
    c.innerHTML = '(' + result.count + ')'
    e.appendChild(c)

    this.setCookie('_like_u', result.user)
  }
}

new Like().load()
