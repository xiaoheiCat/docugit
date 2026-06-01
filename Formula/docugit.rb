# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_08.30.16_7796e4"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.30.16_7796e4/docugit-darwin-arm64"
      sha256 "c35da677811a9178569fc0f95ddbe98298c01789e5a20eb4c345f0defaefdc60"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.30.16_7796e4/docugit-darwin-amd64"
      sha256 "b8116a9fe274b115d47089f1308e2b2822aa43711f8f767e5d92556500ac285b"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.30.16_7796e4/docugit-linux-arm64"
      sha256 "385f291c2d6932059e249f49cd65f0f58f274dd3a8379c29039f46f0a926fcb6"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.30.16_7796e4/docugit-linux-amd64"
      sha256 "0958a029b4c01040903fc47562233fd80d6ad75f5498687672fd591ff45c520a"
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
