# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_04.14.17_091007"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.14.17_091007/docugit-darwin-arm64"
      sha256 "11c8635b5e4b11fd2c3136c8ae45940cb519bc6ef40df7a93a9c0d52ebc2b56c"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.14.17_091007/docugit-darwin-amd64"
      sha256 "c2052069319767c27d0685bf71f1ffce86c9bc8ec8a0c7be24fcf521893ba542"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.14.17_091007/docugit-linux-arm64"
      sha256 "015c9443ac94815f48090b98e51afa8ecadd6bdb7ae10eebf8660440f633c0c7"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.14.17_091007/docugit-linux-amd64"
      sha256 "1005222b2efdc5496a17b773af1cc04c81681f649b756e3234dca394e6298b14"
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
