# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_04.39.25_7fb0a9"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.39.25_7fb0a9/docugit-darwin-arm64"
      sha256 "1b58f3e34d052271c735ec595b31723b70399fd094a82053cb864056bc8f78a2"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.39.25_7fb0a9/docugit-darwin-amd64"
      sha256 "fdf5147038cb12c2c70cbc1a17e813db59517816533d3163fb8bfcbc125764a7"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.39.25_7fb0a9/docugit-linux-arm64"
      sha256 "f18908e8044f2b44481bbd38f8ec408b966dd18b9faed9d271cc0977ae715f72"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_04.39.25_7fb0a9/docugit-linux-amd64"
      sha256 "f938db8795297d6c86b1010172a028e3a89d9e8489e6f96868278783af92cf3d"
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
