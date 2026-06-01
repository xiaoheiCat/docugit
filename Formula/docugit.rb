# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_05.48.16_81d738"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.48.16_81d738/docugit-darwin-arm64"
      sha256 "18ff775b75f181a221157a23918eb1f152a8b9b07f19164db3832e51bd79500a"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.48.16_81d738/docugit-darwin-amd64"
      sha256 "5a8bb29b9bc7b4d93db72c2f8572dd23d83f7ff848d781f0aca4c21657b3b0b8"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.48.16_81d738/docugit-linux-arm64"
      sha256 "e8786058ee957ae98f128868cf1c230d742cfe38a03ddb4cb1d9707979405f84"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_05.48.16_81d738/docugit-linux-amd64"
      sha256 "56988d1af40455728a92eed5c7447db3fd4c6dbfdced191ae3310c87f5f7c656"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
