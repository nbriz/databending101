/* global Averigua */
const DataBendingScript = [
  `As you are surely already aware, glitches occur "naturally" all the time. Glitch artists often save or document glitches they find in "the wild" in their own private "bug collections" or to share (search Glitch Safari on flickr, tumblr and vimeo). Recontenxtualizing these found glitches in an art context is one way of making "readymade" glitch art, another way is to instigate the glitch yourself. For most glitch artists, this all starts in a text editor. Any old text editor will do, just make sure it can be set to "plain text" (like TextEdit on Mac, Notepad++ on Windows or Nano on Linux), you want to avoid editors that do any kind of "rich formatting" (like changing fonts or colors). You'll also need an image file (a JPEG is a good place to start). It's best to make a copy of any file you plan on databending before you do so (it's a lot easier to glitch a file than go the other way, and CMD+Z will only go so far). Rather than double clicking the image (which will open up your computers default image viewer), you want to open the image in your text editor (use the text editor's menu, usually: File > Open). Once open, you should see a bunch of scrambled text or "ASCII barf" as we say in the GLI.TC/H community. If a glitch is an unexpected moment in a digital system that catches you off guard, what you're looking at right now could constitute as a glitch... but let's not stop there, click on the "next step" link below.`,
  `Below I've included a web based text editor and image viewer I made for these tutorials, I've also gone ahead and loaded an image of a cat (of course). The image viewer displays the data stored in that cat.jpg as it's meant to be displayed (a matrix of pixels), but the text editor doesn't know anything about pixels, when it loads data it represents that data as text (in this case ASCII characters). So what we're seeing is the text editors interpretation of the image data stored in the JPEG file. Unlike the default image viewer however, with a text editor we can edit the data stored in the file one byte at a time by editing the text, but be careful, you want to avoid the top section of the file, this is the image header. The header of the file contains metadata like the type of compression used, the dimensions of the image, and other information the image viewer needs in order to properly decode the file. Corrupting the image header will likely result in a broken image. Instead you want to scroll down past the header and insert a bit of random text in there. Which is exactly what I'll do if you click "next step" (of course you're welcome to insert your own random text below).`,
  `Take a look at how I'm editing below...`,
  `You could also copy a chunk of text from one area and paste it a few times elsewhere (again, avoiding the header), like I'm doing below...`,
  `If you're editor has "find and replace" or other automation tooling, try experimenting with those as well. There's no one specific thing you're supposed to do here beyond experiment. Like I explained in the introduction page, the goal is to use technology in a ways they weren't necessarily designed to be used. The core formula is: take a familiar piece of technology and do something unfamiliar with it. Opening up a JPEG in a text editor is only one example of that.`,
  `Lastly, if you do happen to get a glitch you find interesting, it's important to keep in mind that the glitch is the product of both the corrupted (by your edits) file and the application interpreting that file (refer to the next section, "machine code", to better understand this). You've got a "feral" glitch on your machine, if you open that same file with another application you may in fact see an entirely different glitch, which is exciting! But if you do like the look of a particular glitch you can "domesticate" it by taking a screen shot. The screenshot creates a new image which is not corrupted, it's like documentation of the glitch.`
]

const catchunk = `âÞa8Ê%Éü3û^ýkOØÅà\ìñ$Må1f c¡AêÄòèç$kÂÌ(µ7§³Ýv}ý^Ìõ0 °Õ:lû®Þ«§ö <=­@ðé¯ö£j?x¸mÉä|W^­,E>[j»ÿ Ò²úrz>ßå×Ìe×ü!§ÚÏí$&,-Ë çã=ªpò£Nð¯æR­ *N*ßr<¿âgÆû?@KáÏ±ÄËg<¯©Ç8é^Lg½´zË§Ë»ô!ÓÁèåÑuùö^§üø5â¾1oøÞêÛÃ¯p·OyFÚ³¯ú´-S¨Èù¹'9¯J¤£N Aè¿«³7ëÕÖO·åè¸%º¶ÐôÕ5$*Æ¡ 9À ü)ÊN.ÙÃom=óÆºúm¶­m»Û"Eåe¸8Â®A+øãÖ¼ºÕå_Ý¦´þ·g³C°þýW¯ãòGYßÙ\iðÓ¦µKwÜ¡·âÂo>½¸®yTp~g\ióFû'ñ£áî`

const catchunkChrome = `ÄâX¢õûþK½åßöê«®Ú	*yÄY×)÷÷È¯.øûáçÚ«[ÞZXA©\J¥ Y¥KÎ 9åÏúÕ»E³×5{>×õí=¦Wa!¢t¹åV?È0v#×«Gx	ªMï}rÏO°NiPJÝ9¾p§r23÷5FJuÏoÃòt Ö§`

const databe = {
  nd_1: function () {
    const te = document.querySelector('.be-ascii')
    const target = te.scrollHeight / 2

    if (te.scrollTop < target) {
      te.scrollTo(0, te.scrollTop + 300)
      setTimeout(databe.nd_1, 100)
    }

    return ((target - te.scrollTop) / 300) * 100
  },
  nd_2: function () {
    const te = document.querySelector('.be-ascii')
    const target = te.scrollHeight * 0.75
    if (te.scrollTop < target) {
      te.scrollTo(0, te.scrollTop + 300)
      setTimeout(databe.nd_2, 100)
    }
    return {
      time: ((target - te.scrollTop) / 300) * 100,
      chunk: (Averigua.browserInfo().name === 'Chrome') ? catchunkChrome : catchunk
    }
  }
}

if (typeof module !== 'undefined') module.exports = { DataBendingScript, databe }
